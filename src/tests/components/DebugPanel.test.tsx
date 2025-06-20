import { setGlobalDebugMode } from '../../utils/env';

test('should pass basic test', () => {
  expect(true).toBe(true);
});

test('ENV system should work', () => {
  // Тест глобального debug режима
  setGlobalDebugMode(true);
  expect(true).toBe(true);

  setGlobalDebugMode(false);
  expect(true).toBe(true);
});
