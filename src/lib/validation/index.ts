export function validateWeight(value: unknown): string | null {
  const n = Number(value);
  if (isNaN(n)) return 'Вес должен быть числом';
  if (n < 0) return 'Вес не может быть отрицательным';
  return null;
}

export function validateReps(value: unknown): string | null {
  const n = Number(value);
  if (isNaN(n) || !Number.isInteger(n)) return 'Повторения должны быть целым числом';
  if (n <= 0) return 'Повторения должны быть больше 0';
  return null;
}

export function validateExerciseName(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return 'Название упражнения обязательно';
  }
  return null;
}
