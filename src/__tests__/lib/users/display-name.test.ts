import { displayNameFromEmail } from '@/lib/users/display-name';

// Security fix: recipe endpoints are public, so creator emails must never be
// exposed verbatim. Only the local part (before "@") is shown as display name.
describe('displayNameFromEmail', () => {
  it('should return the local part when given a full email address', () => {
    // Arrange
    const email = 'user1@example.com';

    // Act
    const result = displayNameFromEmail(email);

    // Assert
    expect(result).toBe('user1');
  });

  it('should not contain an @ or the domain for any valid email', () => {
    const result = displayNameFromEmail('mbender1309@googlemail.com');

    expect(result).toBe('mbender1309');
    expect(result).not.toContain('@');
    expect(result).not.toContain('googlemail.com');
  });

  it('should return the input unchanged when it contains no @', () => {
    expect(displayNameFromEmail('Unknown')).toBe('Unknown');
  });

  it('should use only the first @ when the local part is followed by multiple @', () => {
    expect(displayNameFromEmail('a@b@c.com')).toBe('a');
  });

  it('should return an empty string for an empty input', () => {
    expect(displayNameFromEmail('')).toBe('');
  });
});
