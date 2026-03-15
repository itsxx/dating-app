const ZODIAC_DATES = [
  { name: 'Capricorn', end: '01-19' },
  { name: 'Aquarius', end: '02-18' },
  { name: 'Pisces', end: '03-20' },
  { name: 'Aries', end: '04-19' },
  { name: 'Taurus', end: '05-20' },
  { name: 'Gemini', end: '06-20' },
  { name: 'Cancer', end: '07-22' },
  { name: 'Leo', end: '08-22' },
  { name: 'Virgo', end: '09-22' },
  { name: 'Libra', end: '10-22' },
  { name: 'Scorpio', end: '11-21' },
  { name: 'Sagittarius', end: '12-21' },
  { name: 'Capricorn', end: '12-31' }
];

const ZODIAC_ELEMENTS = {
  Fire: ['Aries', 'Leo', 'Sagittarius'],
  Earth: ['Taurus', 'Virgo', 'Capricorn'],
  Air: ['Gemini', 'Libra', 'Aquarius'],
  Water: ['Cancer', 'Scorpio', 'Pisces']
};

const ELEMENT_COMPATIBILITY = {
  Fire: 'Air',
  Air: 'Fire',
  Earth: 'Water',
  Water: 'Earth'
};

function getZodiacSign(birthday) {
  const date = new Date(birthday);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateStr = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  for (const zodiac of ZODIAC_DATES) {
    if (dateStr <= zodiac.end) {
      return zodiac.name;
    }
  }

  return 'Capricorn';
}

function getZodiacElement(sign) {
  for (const [element, signs] of Object.entries(ZODIAC_ELEMENTS)) {
    if (signs.includes(sign)) {
      return element;
    }
  }
  return null;
}

function getComplementaryZodiac(sign) {
  const element = getZodiacElement(sign);
  const complementaryElement = ELEMENT_COMPATIBILITY[element];
  return ZODIAC_ELEMENTS[complementaryElement] || [];
}

module.exports = {
  getZodiacSign,
  getZodiacElement,
  getComplementaryZodiac
};
