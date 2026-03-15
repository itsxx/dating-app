const { calculateMBTI, getComplementaryMBTI, getMBTIQuestions } = require('../../src/utils/mbti');

describe('calculateMBTI', () => {
  it('should return INFJ for balanced introvert answers', () => {
    const answers = [
      { dimension: 'EI', choice: 'I' },
      { dimension: 'SN', choice: 'N' },
      { dimension: 'TF', choice: 'F' },
      { dimension: 'JP', choice: 'J' }
    ];
    expect(calculateMBTI(answers)).toBe('INFJ');
  });

  it('should return ENTP for extroverted answers', () => {
    const answers = [
      { dimension: 'EI', choice: 'E' },
      { dimension: 'SN', choice: 'N' },
      { dimension: 'TF', choice: 'T' },
      { dimension: 'JP', choice: 'P' }
    ];
    expect(calculateMBTI(answers)).toBe('ENTP');
  });
});

describe('getComplementaryMBTI', () => {
  it('should return ENFP for INFJ', () => {
    expect(getComplementaryMBTI('INFJ')).toBe('ENFP');
  });

  it('should return ENTP for INTJ', () => {
    expect(getComplementaryMBTI('INTJ')).toBe('ENTP');
  });

  it('should return INFJ for ENFP', () => {
    expect(getComplementaryMBTI('ENFP')).toBe('INFJ');
  });
});
