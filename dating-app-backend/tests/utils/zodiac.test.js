const { getZodiacSign, getZodiacElement, getComplementaryZodiac } = require('../../src/utils/zodiac');

describe('getZodiacSign', () => {
  it('should return Aquarius for January 20', () => {
    expect(getZodiacSign('2000-01-20')).toBe('Aquarius');
  });

  it('should return Pisces for March 15', () => {
    expect(getZodiacSign('2000-03-15')).toBe('Pisces');
  });

  it('should return Aries for April 1', () => {
    expect(getZodiacSign('2000-04-01')).toBe('Aries');
  });
});

describe('getZodiacElement', () => {
  it('should return Fire for Aries', () => {
    expect(getZodiacElement('Aries')).toBe('Fire');
  });

  it('should return Water for Pisces', () => {
    expect(getZodiacElement('Pisces')).toBe('Water');
  });
});

describe('getComplementaryZodiac', () => {
  it('should return Air signs for Fire signs', () => {
    const complements = getComplementaryZodiac('Aries');
    expect(complements).toContain('Gemini');
    expect(complements).toContain('Libra');
    expect(complements).toContain('Aquarius');
  });
});
