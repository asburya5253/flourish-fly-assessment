// Flourish & Fly – Baseline Computation Assessment Question Bank
// Each assessment is keyed by topic. Questions use typed answers (not multiple choice).
//
// Question types:
//   "horizontal"      →  displayed as:  3 + 6 = ___
//   "missing-addend"  →  displayed as:  4 + ___ = 10
//   "vertical"        →  displayed as a stacked problem with a line underneath

var questionBank = {

  addition: {
    title: "Whole Number Addition",
    operation: "+",
    questions: [
      { id: 1, type: "horizontal", parts: [3, 6],          answer: 9,      skill: "Single-digit addition" },
      { id: 2, type: "horizontal", parts: [5, 9],          answer: 14,     skill: "Single-digit addition" },
      { id: 3, type: "missing-addend", left: 4, sum: 10,   answer: 6,      skill: "Missing addend" },
      { id: 4, type: "missing-addend", left: 12, sum: 27,  answer: 15,     skill: "Missing addend" },
      { id: 5, type: "vertical", top: 13, bottom: 25,      answer: 38,     skill: "2-digit addition" },
      { id: 6, type: "vertical", top: 27, bottom: 62,      answer: 89,     skill: "2-digit addition" },
      { id: 7, type: "vertical", top: 329, bottom: 685,    answer: 1014,   skill: "3-digit addition with regrouping" },
      { id: 8, type: "vertical", top: 742, bottom: 648,    answer: 1390,   skill: "3-digit addition with regrouping" },
      { id: 9, type: "vertical", top: 6314, bottom: 3989,  answer: 10303,  skill: "4-digit addition with regrouping" },
      { id: 10, type: "vertical", top: 528294, bottom: 325246, answer: 853540, skill: "6-digit addition" }
    ]
  }

};
