import { maxValue, minValue, required } from '../inputValidation';

describe('utils/inputValidation', () => {
  test('maxValue', () => {
    const r1 = maxValue(10)(9);
    const r2 = maxValue(10)(11);

    expect(r1).toBe(undefined);
    expect(r2).toBe('Should be less than 10');
  });

  test('minValue', () => {
    const r1 = minValue(10)(11);
    const r2 = minValue(10)(9);

    expect(r1).toBe(undefined);
    expect(r2).toBe('Should be greater than 10');
  });

  test('minValue', () => {
    const r1 = required(10);
    const r2 = required();

    expect(r1).toBe(undefined);
    expect(r2).toBe('Required');
  });
});
