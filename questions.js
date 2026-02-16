// Flourish & Fly – Baseline Computation Assessment Question Bank
// Each assessment is keyed by topic. Questions use typed answers (not multiple choice).
//
// Question types:
//   "horizontal"          →  displayed as:  3 + 6 = ___
//   "missing-addend"      →  displayed as:  4 + ___ = 10
//   "missing-subtrahend"  →  displayed as:  12 - ___ = 5
//   "missing-minuend"     →  displayed as:  ___ - 4 = 7
//   "vertical"            →  displayed as a stacked problem with a line underneath

var questionBank = {

  addition: {
    title: "Whole Number Addition",
    operation: "+",
    // Mastery thresholds: 8-10 = Mastered, 6-7 = Needs Review, 0-5 = Full Reteach
    mastery: { mastered: 8, review: 6 },
    questions: [
      { id: 1,  type: "horizontal",     parts: [3, 6],             answer: 9,      skill: "Addition under 10" },
      { id: 2,  type: "horizontal",     parts: [5, 9],             answer: 14,     skill: "Addition under 20" },
      { id: 3,  type: "missing-addend", left: 4, sum: 10,          answer: 6,      skill: "Missing addend" },
      { id: 4,  type: "missing-addend", left: 12, sum: 27,         answer: 15,     skill: "Missing addend" },
      { id: 5,  type: "vertical", top: 13, bottom: 25,             answer: 38,     skill: "2-digit without regrouping" },
      { id: 6,  type: "vertical", top: 27, bottom: 62,             answer: 89,     skill: "2-digit without regrouping" },
      { id: 7,  type: "vertical", top: 329, bottom: 685,           answer: 1014,   skill: "2-digit with regrouping" },
      { id: 8,  type: "vertical", top: 742, bottom: 648,           answer: 1390,   skill: "2-digit with regrouping" },
      { id: 9,  type: "vertical", top: 6314, bottom: 3989,         answer: 10303,  skill: "4-digit with regrouping" },
      { id: 10, type: "vertical", top: 528294, bottom: 325246,     answer: 853540, skill: "6-digit with regrouping" }
    ]
  },

  subtraction: {
    title: "Whole Number Subtraction",
    operation: "-",
    mastery: { mastered: 8, review: 6 },
    questions: [
      { id: 1,  type: "horizontal",          parts: [9, 3],                    answer: 6,    skill: "Subtraction under 10" },
      { id: 2,  type: "horizontal",          parts: [8, 5],                    answer: 3,    skill: "Subtraction under 10" },
      { id: 3,  type: "missing-subtrahend",  left: 12, difference: 5,         answer: 7,    skill: "Missing number" },
      { id: 4,  type: "missing-minuend",     right: 4, difference: 7,         answer: 11,   skill: "Missing number" },
      { id: 5,  type: "vertical", top: 54, bottom: 21,                        answer: 33,   skill: "2-digit without regrouping" },
      { id: 6,  type: "vertical", top: 63, bottom: 42,                        answer: 21,   skill: "2-digit without regrouping" },
      { id: 7,  type: "vertical", top: 72, bottom: 48,                        answer: 24,   skill: "With regrouping" },
      { id: 8,  type: "vertical", top: 356, bottom: 128,                      answer: 228,  skill: "With regrouping" },
      { id: 9,  type: "vertical", top: 500, bottom: 276,                      answer: 224,  skill: "Across zeros" },
      { id: 10, type: "vertical", top: 4002, bottom: 1659,                    answer: 2343, skill: "Across zeros" }
    ]
  }

};
