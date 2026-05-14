import { apiCall } from '../../lib/api';

describe('API Client', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should make successful API call', async () => {
    const mockResponse = { data: { id: 1, email: 'test@example.com' } };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await apiCall('/test');

    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeUndefined();
  });

  test('should handle API errors', async () => {
    const mockError = { error: 'Invalid email' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    });

    const result = await apiCall('/test');

    expect(result.error).toBe('Invalid email');
    expect(result.data).toBeUndefined();
  });
});
