const MBTI_QUESTIONS = [
  // E/I questions (1-6)
  { id: 1, dimension: 'EI', text: '在聚会上，你会主动与陌生人交谈吗？', options: { A: 'E', B: 'I' } },
  { id: 2, dimension: 'EI', text: '你更喜欢独处还是与人相处？', options: { A: 'I', B: 'E' } },
  { id: 3, dimension: 'EI', text: '朋友描述你时，会说你外向吗？', options: { A: 'E', B: 'I' } },
  { id: 4, dimension: 'EI', text: '你通过社交获得能量还是通过独处恢复能量？', options: { A: 'E', B: 'I' } },
  { id: 5, dimension: 'EI', text: '你更倾向于先说话还是先倾听？', options: { A: 'E', B: 'I' } },
  { id: 6, dimension: 'EI', text: '你喜欢广泛的社交圈还是少数深交的朋友？', options: { A: 'E', B: 'I' } },

  // S/N questions (7-12)
  { id: 7, dimension: 'SN', text: '你更关注细节还是整体概念？', options: { A: 'S', B: 'N' } },
  { id: 8, dimension: 'SN', text: '你相信经验还是直觉？', options: { A: 'S', B: 'N' } },
  { id: 9, dimension: 'SN', text: '你更喜欢具体的事实还是抽象的理论？', options: { A: 'S', B: 'N' } },
  { id: 10, dimension: 'SN', text: '你注重当下还是未来可能性？', options: { A: 'S', B: 'N' } },
  { id: 11, dimension: 'SN', text: '你更信任实际经验还是第六感？', options: { A: 'S', B: 'N' } },
  { id: 12, dimension: 'SN', text: '你描述事物时更具体还是更抽象？', options: { A: 'S', B: 'N' } },

  // T/F questions (13-18)
  { id: 13, dimension: 'TF', text: '做决定时，你更依赖逻辑还是感受？', options: { A: 'T', B: 'F' } },
  { id: 14, dimension: 'TF', text: '你更看重公平还是和谐？', options: { A: 'T', B: 'F' } },
  { id: 15, dimension: 'TF', text: '批评他人时，你直接还是委婉？', options: { A: 'T', B: 'F' } },
  { id: 16, dimension: 'TF', text: '你更关注真相还是他人感受？', options: { A: 'T', B: 'F' } },
  { id: 17, dimension: 'TF', text: '争论时，你追求赢还是维持关系？', options: { A: 'T', B: 'F' } },
  { id: 18, dimension: 'TF', text: '你更理性还是更感性？', options: { A: 'T', B: 'F' } },

  // J/P questions (19-24)
  { id: 19, dimension: 'JP', text: '你喜欢计划还是随性？', options: { A: 'J', B: 'P' } },
  { id: 20, dimension: 'JP', text: '你的工作空间通常整洁还是凌乱？', options: { A: 'J', B: 'P' } },
  { id: 21, dimension: 'JP', text: '你更喜欢提前决定还是保持开放？', options: { A: 'J', B: 'P' } },
  { id: 22, dimension: 'JP', text: '截止日期对你来说是动力还是压力？', options: { A: 'J', B: 'P' } },
  { id: 23, dimension: 'JP', text: '你习惯完成任务还是同时做多件事？', options: { A: 'J', B: 'P' } },
  { id: 24, dimension: 'JP', text: '你喜欢结构化还是灵活的生活方式？', options: { A: 'J', B: 'P' } }
];

const COMPLEMENTARY_TYPES = {
  'INFJ': 'ENFP', 'ENFP': 'INFJ',
  'INTJ': 'ENTP', 'ENTP': 'INTJ',
  'INFP': 'ENFJ', 'ENFJ': 'INFP',
  'INTP': 'ENTJ', 'ENTJ': 'INTP',
  'ISTJ': 'ESFP', 'ESFP': 'ISTJ',
  'ISFJ': 'ESFP', 'ESFJ': 'ISFJ',
  'ISTP': 'ESFJ', 'ESTP': 'ISFJ',
  'ISFP': 'ESFJ', 'ESTJ': 'ISFP'
};

function calculateMBTI(answers) {
  const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  answers.forEach(answer => {
    if (scores[answer.choice] !== undefined) {
      scores[answer.choice]++;
    }
  });

  const type = [
    scores.E >= scores.I ? 'E' : 'I',
    scores.S >= scores.N ? 'S' : 'N',
    scores.T >= scores.F ? 'T' : 'F',
    scores.J >= scores.P ? 'J' : 'P'
  ].join('');

  return type;
}

function getComplementaryMBTI(type) {
  return COMPLEMENTARY_TYPES[type] || type;
}

function getMBTIQuestions() {
  return MBTI_QUESTIONS.map(q => ({
    id: q.id,
    dimension: q.dimension,
    text: q.text
  }));
}

module.exports = {
  calculateMBTI,
  getComplementaryMBTI,
  getMBTIQuestions
};
