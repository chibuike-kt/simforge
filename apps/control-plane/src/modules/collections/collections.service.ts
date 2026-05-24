import { Injectable, NotFoundException } from '@nestjs/common';
import { getDb } from '../../db/database';

export interface CreateCollectionDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

@Injectable()
export class CollectionsService {
  private readonly sql = getDb();

  async findAll(userId: string) {
    const collections = await this.sql`
      SELECT
        c.*,
        COUNT(cs.scenario_id)::int as scenario_count
      FROM collections c
      LEFT JOIN collection_scenarios cs ON cs.collection_id = c.id
      WHERE c.created_by = ${userId}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;

    // For each collection load its scenarios
    const result = await Promise.all(
      collections.map(async (col) => {
        const scenarios = await this.sql`
          SELECT s.id, s.name, s.status, s.version, cs.position
          FROM simulation_scenarios s
          JOIN collection_scenarios cs ON cs.scenario_id = s.id
          WHERE cs.collection_id = ${col.id}
          ORDER BY cs.position ASC
        `;
        return { ...col, scenarios };
      }),
    );

    return result;
  }

  async create(dto: CreateCollectionDto, createdBy: string) {
    const [row] = await this.sql`
      INSERT INTO collections (name, description, color, icon, created_by)
      VALUES (
        ${dto.name},
        ${dto.description ?? null},
        ${dto.color ?? '#3b82f6'},
        ${dto.icon ?? 'folder'},
        ${createdBy}
      ) RETURNING *
    `;
    return { ...row, scenarios: [] };
  }

  async update(id: string, dto: Partial<CreateCollectionDto>) {
    const [row] = await this.sql`
      UPDATE collections
      SET
        name        = COALESCE(${dto.name ?? null}, name),
        description = COALESCE(${dto.description ?? null}, description),
        color       = COALESCE(${dto.color ?? null}, color),
        updated_at  = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (!row) throw new NotFoundException(`Collection ${id} not found`);
    return row;
  }

  async delete(id: string) {
    await this.sql`DELETE FROM collections WHERE id = ${id}`;
    return { deleted: true };
  }

  async addScenario(collectionId: string, scenarioId: string) {
    const maxPos = await this.sql`
      SELECT COALESCE(MAX(position), -1) as max_pos
      FROM collection_scenarios
      WHERE collection_id = ${collectionId}
    `;
    const position = (maxPos[0]?.maxPos ?? -1) + 1;

    await this.sql`
      INSERT INTO collection_scenarios (collection_id, scenario_id, position)
      VALUES (${collectionId}, ${scenarioId}, ${position})
      ON CONFLICT (collection_id, scenario_id) DO NOTHING
    `;
    return { added: true };
  }

  async removeScenario(collectionId: string, scenarioId: string) {
    await this.sql`
      DELETE FROM collection_scenarios
      WHERE collection_id = ${collectionId} AND scenario_id = ${scenarioId}
    `;
    return { removed: true };
  }

  async getByScenario(scenarioId: string) {
    return this.sql`
      SELECT c.*
      FROM collections c
      JOIN collection_scenarios cs ON cs.collection_id = c.id
      WHERE cs.scenario_id = ${scenarioId}
    `;
  }
}
