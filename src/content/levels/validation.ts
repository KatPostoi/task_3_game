import type {
  LevelAreaDefinition,
  LevelBackgroundDefinition,
  LevelCoinDefinition,
  LevelDebugGridDefinition,
  LevelDefinition,
  LevelEnemyDefinition,
  LevelPlatformDefinition,
} from "@/content/levels/types";

interface ValidationBounds {
  readonly height: number;
  readonly width: number;
}

export interface LevelValidationIssue {
  readonly message: string;
  readonly path: string;
}

export function validateLevelDefinition(
  level: LevelDefinition,
): readonly LevelValidationIssue[] {
  const issues: LevelValidationIssue[] = [];
  const bounds = level.worldSize;

  validateWorldBounds(bounds, issues);
  validateBackground(level.background, issues);
  validatePointInWorld(level.spawnPoint.x, level.spawnPoint.y, bounds, issues, {
    label: "spawn point",
    path: "spawnPoint",
  });
  validateArea(level.finishZone, bounds, issues, {
    label: "finish zone",
    path: "finishZone",
  });

  if (level.debugGrid) {
    validateDebugGrid(level.debugGrid, issues);
  }

  level.platforms.forEach((platform, index) => {
    validatePlatform(platform, bounds, issues, index);
  });

  level.coins.forEach((coin, index) => {
    validateCoin(coin, bounds, issues, index);
  });

  level.enemies.forEach((enemy, index) => {
    validateEnemy(enemy, bounds, issues, index);
  });

  return issues;
}

export function assertValidLevelDefinition(level: LevelDefinition): void {
  const issues = validateLevelDefinition(level);

  if (issues.length === 0) {
    return;
  }

  const message = issues
    .map((issue) => `${issue.path}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid level definition "${level.key}": ${message}`);
}

function pushIssue(
  issues: LevelValidationIssue[],
  path: string,
  message: string,
): void {
  issues.push({ message, path });
}

function validateWorldBounds(
  bounds: ValidationBounds,
  issues: LevelValidationIssue[],
): void {
  if (bounds.width <= 0) {
    pushIssue(issues, "worldSize.width", "must be greater than 0");
  }

  if (bounds.height <= 0) {
    pushIssue(issues, "worldSize.height", "must be greater than 0");
  }
}

function validateBackground(
  background: LevelBackgroundDefinition,
  issues: LevelValidationIssue[],
): void {
  if (
    background.alpha !== undefined &&
    (background.alpha < 0 || background.alpha > 1)
  ) {
    pushIssue(issues, "background.alpha", "must be between 0 and 1");
  }
}

function validateDebugGrid(
  debugGrid: LevelDebugGridDefinition,
  issues: LevelValidationIssue[],
): void {
  if (debugGrid.cellSize <= 0) {
    pushIssue(issues, "debugGrid.cellSize", "must be greater than 0");
  }

  if (debugGrid.alpha < 0 || debugGrid.alpha > 1) {
    pushIssue(issues, "debugGrid.alpha", "must be between 0 and 1");
  }
}

function validatePlatform(
  platform: LevelPlatformDefinition,
  bounds: ValidationBounds,
  issues: LevelValidationIssue[],
  index: number,
): void {
  validatePointInWorld(platform.x, platform.y, bounds, issues, {
    label: "platform",
    path: `platforms[${index}]`,
  });

  if (platform.width !== undefined && platform.width <= 0) {
    pushIssue(issues, `platforms[${index}].width`, "must be greater than 0");
  }

  if (platform.height !== undefined && platform.height <= 0) {
    pushIssue(issues, `platforms[${index}].height`, "must be greater than 0");
  }
}

function validateCoin(
  coin: LevelCoinDefinition,
  bounds: ValidationBounds,
  issues: LevelValidationIssue[],
  index: number,
): void {
  validatePointInWorld(coin.x, coin.y, bounds, issues, {
    label: "coin",
    path: `coins[${index}]`,
  });

  if (coin.scoreValue !== undefined && coin.scoreValue <= 0) {
    pushIssue(
      issues,
      `coins[${index}].scoreValue`,
      "must be greater than 0 when provided",
    );
  }
}

function validateEnemy(
  enemy: LevelEnemyDefinition,
  bounds: ValidationBounds,
  issues: LevelValidationIssue[],
  index: number,
): void {
  validatePointInWorld(enemy.x, enemy.y, bounds, issues, {
    label: "enemy",
    path: `enemies[${index}]`,
  });

  if (enemy.speed !== undefined && enemy.speed <= 0) {
    pushIssue(issues, `enemies[${index}].speed`, "must be greater than 0");
  }

  if (enemy.patrolDistance !== undefined && enemy.patrolDistance < 0) {
    pushIssue(
      issues,
      `enemies[${index}].patrolDistance`,
      "must be 0 or greater",
    );
  }

  if (enemy.scale !== undefined && enemy.scale <= 0) {
    pushIssue(issues, `enemies[${index}].scale`, "must be greater than 0");
  }
}

function validateArea(
  area: LevelAreaDefinition,
  bounds: ValidationBounds,
  issues: LevelValidationIssue[],
  context: { readonly label: string; readonly path: string },
): void {
  if (area.width <= 0) {
    pushIssue(issues, `${context.path}.width`, "must be greater than 0");
  }

  if (area.height <= 0) {
    pushIssue(issues, `${context.path}.height`, "must be greater than 0");
  }

  if (area.x < 0 || area.y < 0) {
    pushIssue(
      issues,
      context.path,
      `${context.label} must start inside the world bounds`,
    );
  }

  if (
    area.x + area.width > bounds.width ||
    area.y + area.height > bounds.height
  ) {
    pushIssue(
      issues,
      context.path,
      `${context.label} must stay inside the world bounds`,
    );
  }
}

function validatePointInWorld(
  x: number,
  y: number,
  bounds: ValidationBounds,
  issues: LevelValidationIssue[],
  context: { readonly label: string; readonly path: string },
): void {
  if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) {
    pushIssue(
      issues,
      context.path,
      `${context.label} must stay inside the world bounds`,
    );
  }
}
