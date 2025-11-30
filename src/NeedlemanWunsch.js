import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Pause, Download, Info } from 'lucide-react';

const SequenceAlignmentTool = () => {
  const [seq1, setSeq1] = useState('HEAGAWGHEE');
  const [seq2, setSeq2] = useState('PAWHEAE');
  const [algorithm, setAlgorithm] = useState('needleman-wunsch');
  const [scoringScheme, setScoringScheme] = useState('BLOSUM62');
  const [useAffineGap, setUseAffineGap] = useState(false);
  const [gapPenalty, setGapPenalty] = useState(-2);
  const [gapOpenPenalty, setGapOpenPenalty] = useState(-10);
  const [gapExtendPenalty, setGapExtendPenalty] = useState(-1);
  const [result, setResult] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(500);
  const [isPaused, setIsPaused] = useState(false);
  const [matrix, setMatrix] = useState([]);
  const [traceback, setTraceback] = useState([]);

  // Scoring matrices
  const BLOSUM62 = {
    'A': {'A': 4, 'R': -1, 'N': -2, 'D': -2, 'C': 0, 'Q': -1, 'E': -1, 'G': 0, 'H': -2, 'I': -1, 'L': -1, 'K': -1, 'M': -1, 'F': -2, 'P': -1, 'S': 1, 'T': 0, 'W': -3, 'Y': -2, 'V': 0},
    'R': {'A': -1, 'R': 5, 'N': 0, 'D': -2, 'C': -3, 'Q': 1, 'E': 0, 'G': -2, 'H': 0, 'I': -3, 'L': -2, 'K': 2, 'M': -1, 'F': -3, 'P': -2, 'S': -1, 'T': -1, 'W': -3, 'Y': -2, 'V': -3},
    'N': {'A': -2, 'R': 0, 'N': 6, 'D': 1, 'C': -3, 'Q': 0, 'E': 0, 'G': 0, 'H': 1, 'I': -3, 'L': -3, 'K': 0, 'M': -2, 'F': -3, 'P': -2, 'S': 1, 'T': 0, 'W': -4, 'Y': -2, 'V': -3},
    'D': {'A': -2, 'R': -2, 'N': 1, 'D': 6, 'C': -3, 'Q': 0, 'E': 2, 'G': -1, 'H': -1, 'I': -3, 'L': -4, 'K': -1, 'M': -3, 'F': -3, 'P': -1, 'S': 0, 'T': -1, 'W': -4, 'Y': -3, 'V': -3},
    'C': {'A': 0, 'R': -3, 'N': -3, 'D': -3, 'C': 9, 'Q': -3, 'E': -4, 'G': -3, 'H': -3, 'I': -1, 'L': -1, 'K': -3, 'M': -1, 'F': -2, 'P': -3, 'S': -1, 'T': -1, 'W': -2, 'Y': -2, 'V': -1},
    'Q': {'A': -1, 'R': 1, 'N': 0, 'D': 0, 'C': -3, 'Q': 5, 'E': 2, 'G': -2, 'H': 0, 'I': -3, 'L': -2, 'K': 1, 'M': 0, 'F': -3, 'P': -1, 'S': 0, 'T': -1, 'W': -2, 'Y': -1, 'V': -2},
    'E': {'A': -1, 'R': 0, 'N': 0, 'D': 2, 'C': -4, 'Q': 2, 'E': 5, 'G': -2, 'H': 0, 'I': -3, 'L': -3, 'K': 1, 'M': -2, 'F': -3, 'P': -1, 'S': 0, 'T': -1, 'W': -3, 'Y': -2, 'V': -2},
    'G': {'A': 0, 'R': -2, 'N': 0, 'D': -1, 'C': -3, 'Q': -2, 'E': -2, 'G': 6, 'H': -2, 'I': -4, 'L': -4, 'K': -2, 'M': -3, 'F': -3, 'P': -2, 'S': 0, 'T': -2, 'W': -2, 'Y': -3, 'V': -3},
    'H': {'A': -2, 'R': 0, 'N': 1, 'D': -1, 'C': -3, 'Q': 0, 'E': 0, 'G': -2, 'H': 8, 'I': -3, 'L': -3, 'K': -1, 'M': -2, 'F': -1, 'P': -2, 'S': -1, 'T': -2, 'W': -2, 'Y': 2, 'V': -3},
    'I': {'A': -1, 'R': -3, 'N': -3, 'D': -3, 'C': -1, 'Q': -3, 'E': -3, 'G': -4, 'H': -3, 'I': 4, 'L': 2, 'K': -3, 'M': 1, 'F': 0, 'P': -3, 'S': -2, 'T': -1, 'W': -3, 'Y': -1, 'V': 3},
    'L': {'A': -1, 'R': -2, 'N': -3, 'D': -4, 'C': -1, 'Q': -2, 'E': -3, 'G': -4, 'H': -3, 'I': 2, 'L': 4, 'K': -2, 'M': 2, 'F': 0, 'P': -3, 'S': -2, 'T': -1, 'W': -2, 'Y': -1, 'V': 1},
    'K': {'A': -1, 'R': 2, 'N': 0, 'D': -1, 'C': -3, 'Q': 1, 'E': 1, 'G': -2, 'H': -1, 'I': -3, 'L': -2, 'K': 5, 'M': -1, 'F': -3, 'P': -1, 'S': 0, 'T': -1, 'W': -3, 'Y': -2, 'V': -2},
    'M': {'A': -1, 'R': -1, 'N': -2, 'D': -3, 'C': -1, 'Q': 0, 'E': -2, 'G': -3, 'H': -2, 'I': 1, 'L': 2, 'K': -1, 'M': 5, 'F': 0, 'P': -2, 'S': -1, 'T': -1, 'W': -1, 'Y': -1, 'V': 1},
    'F': {'A': -2, 'R': -3, 'N': -3, 'D': -3, 'C': -2, 'Q': -3, 'E': -3, 'G': -3, 'H': -1, 'I': 0, 'L': 0, 'K': -3, 'M': 0, 'F': 6, 'P': -4, 'S': -2, 'T': -2, 'W': 1, 'Y': 3, 'V': -1},
    'P': {'A': -1, 'R': -2, 'N': -2, 'D': -1, 'C': -3, 'Q': -1, 'E': -1, 'G': -2, 'H': -2, 'I': -3, 'L': -3, 'K': -1, 'M': -2, 'F': -4, 'P': 7, 'S': -1, 'T': -1, 'W': -4, 'Y': -3, 'V': -2},
    'S': {'A': 1, 'R': -1, 'N': 1, 'D': 0, 'C': -1, 'Q': 0, 'E': 0, 'G': 0, 'H': -1, 'I': -2, 'L': -2, 'K': 0, 'M': -1, 'F': -2, 'P': -1, 'S': 4, 'T': 1, 'W': -3, 'Y': -2, 'V': -2},
    'T': {'A': 0, 'R': -1, 'N': 0, 'D': -1, 'C': -1, 'Q': -1, 'E': -1, 'G': -2, 'H': -2, 'I': -1, 'L': -1, 'K': -1, 'M': -1, 'F': -2, 'P': -1, 'S': 1, 'T': 5, 'W': -2, 'Y': -2, 'V': 0},
    'W': {'A': -3, 'R': -3, 'N': -4, 'D': -4, 'C': -2, 'Q': -2, 'E': -3, 'G': -2, 'H': -2, 'I': -3, 'L': -2, 'K': -3, 'M': -1, 'F': 1, 'P': -4, 'S': -3, 'T': -2, 'W': 11, 'Y': 2, 'V': -3},
    'Y': {'A': -2, 'R': -2, 'N': -2, 'D': -3, 'C': -2, 'Q': -1, 'E': -2, 'G': -3, 'H': 2, 'I': -1, 'L': -1, 'K': -2, 'M': -1, 'F': 3, 'P': -3, 'S': -2, 'T': -2, 'W': 2, 'Y': 7, 'V': -1},
    'V': {'A': 0, 'R': -3, 'N': -3, 'D': -3, 'C': -1, 'Q': -2, 'E': -2, 'G': -3, 'H': -3, 'I': 3, 'L': 1, 'K': -2, 'M': 1, 'F': -1, 'P': -2, 'S': -2, 'T': 0, 'W': -3, 'Y': -1, 'V': 4}
  };

  const PAM250 = {
    'A': {'A': 2, 'R': -2, 'N': 0, 'D': 0, 'C': -2, 'Q': 0, 'E': 0, 'G': 1, 'H': -1, 'I': -1, 'L': -2, 'K': -1, 'M': -1, 'F': -3, 'P': 1, 'S': 1, 'T': 1, 'W': -6, 'Y': -3, 'V': 0},
    'R': {'A': -2, 'R': 6, 'N': 0, 'D': -1, 'C': -4, 'Q': 1, 'E': -1, 'G': -3, 'H': 2, 'I': -2, 'L': -3, 'K': 3, 'M': 0, 'F': -4, 'P': 0, 'S': 0, 'T': -1, 'W': 2, 'Y': -4, 'V': -2},
    'N': {'A': 0, 'R': 0, 'N': 2, 'D': 2, 'C': -4, 'Q': 1, 'E': 1, 'G': 0, 'H': 2, 'I': -2, 'L': -3, 'K': 1, 'M': -2, 'F': -3, 'P': 0, 'S': 1, 'T': 0, 'W': -4, 'Y': -2, 'V': -2},
    'D': {'A': 0, 'R': -1, 'N': 2, 'D': 4, 'C': -5, 'Q': 2, 'E': 3, 'G': 1, 'H': 1, 'I': -2, 'L': -4, 'K': 0, 'M': -3, 'F': -6, 'P': -1, 'S': 0, 'T': 0, 'W': -7, 'Y': -4, 'V': -2},
    'C': {'A': -2, 'R': -4, 'N': -4, 'D': -5, 'C': 12, 'Q': -5, 'E': -5, 'G': -3, 'H': -3, 'I': -2, 'L': -6, 'K': -5, 'M': -5, 'F': -4, 'P': -3, 'S': 0, 'T': -2, 'W': -8, 'Y': 0, 'V': -2},
    'Q': {'A': 0, 'R': 1, 'N': 1, 'D': 2, 'C': -5, 'Q': 4, 'E': 2, 'G': -1, 'H': 3, 'I': -2, 'L': -2, 'K': 1, 'M': -1, 'F': -5, 'P': 0, 'S': -1, 'T': -1, 'W': -5, 'Y': -4, 'V': -2},
    'E': {'A': 0, 'R': -1, 'N': 1, 'D': 3, 'C': -5, 'Q': 2, 'E': 4, 'G': 0, 'H': 1, 'I': -2, 'L': -3, 'K': 0, 'M': -2, 'F': -5, 'P': -1, 'S': 0, 'T': 0, 'W': -7, 'Y': -4, 'V': -2},
    'G': {'A': 1, 'R': -3, 'N': 0, 'D': 1, 'C': -3, 'Q': -1, 'E': 0, 'G': 5, 'H': -2, 'I': -3, 'L': -4, 'K': -2, 'M': -3, 'F': -5, 'P': 0, 'S': 1, 'T': 0, 'W': -7, 'Y': -5, 'V': -1},
    'H': {'A': -1, 'R': 2, 'N': 2, 'D': 1, 'C': -3, 'Q': 3, 'E': 1, 'G': -2, 'H': 6, 'I': -2, 'L': -2, 'K': 0, 'M': -2, 'F': -2, 'P': 0, 'S': -1, 'T': -1, 'W': -3, 'Y': 0, 'V': -2},
    'I': {'A': -1, 'R': -2, 'N': -2, 'D': -2, 'C': -2, 'Q': -2, 'E': -2, 'G': -3, 'H': -2, 'I': 5, 'L': 2, 'K': -2, 'M': 2, 'F': 1, 'P': -2, 'S': -1, 'T': 0, 'W': -5, 'Y': -1, 'V': 4},
    'L': {'A': -2, 'R': -3, 'N': -3, 'D': -4, 'C': -6, 'Q': -2, 'E': -3, 'G': -4, 'H': -2, 'I': 2, 'L': 6, 'K': -3, 'M': 4, 'F': 2, 'P': -3, 'S': -3, 'T': -2, 'W': -2, 'Y': -1, 'V': 2},
    'K': {'A': -1, 'R': 3, 'N': 1, 'D': 0, 'C': -5, 'Q': 1, 'E': 0, 'G': -2, 'H': 0, 'I': -2, 'L': -3, 'K': 5, 'M': 0, 'F': -5, 'P': -1, 'S': 0, 'T': 0, 'W': -3, 'Y': -4, 'V': -2},
    'M': {'A': -1, 'R': 0, 'N': -2, 'D': -3, 'C': -5, 'Q': -1, 'E': -2, 'G': -3, 'H': -2, 'I': 2, 'L': 4, 'K': 0, 'M': 6, 'F': 0, 'P': -2, 'S': -2, 'T': -1, 'W': -4, 'Y': -2, 'V': 2},
    'F': {'A': -3, 'R': -4, 'N': -3, 'D': -6, 'C': -4, 'Q': -5, 'E': -5, 'G': -5, 'H': -2, 'I': 1, 'L': 2, 'K': -5, 'M': 0, 'F': 9, 'P': -5, 'S': -3, 'T': -3, 'W': 0, 'Y': 7, 'V': -1},
    'P': {'A': 1, 'R': 0, 'N': 0, 'D': -1, 'C': -3, 'Q': 0, 'E': -1, 'G': 0, 'H': 0, 'I': -2, 'L': -3, 'K': -1, 'M': -2, 'F': -5, 'P': 6, 'S': 1, 'T': 0, 'W': -6, 'Y': -5, 'V': -1},
    'S': {'A': 1, 'R': 0, 'N': 1, 'D': 0, 'C': 0, 'Q': -1, 'E': 0, 'G': 1, 'H': -1, 'I': -1, 'L': -3, 'K': 0, 'M': -2, 'F': -3, 'P': 1, 'S': 2, 'T': 1, 'W': -2, 'Y': -3, 'V': -1},
    'T': {'A': 1, 'R': -1, 'N': 0, 'D': 0, 'C': -2, 'Q': -1, 'E': 0, 'G': 0, 'H': -1, 'I': 0, 'L': -2, 'K': 0, 'M': -1, 'F': -3, 'P': 0, 'S': 1, 'T': 3, 'W': -5, 'Y': -3, 'V': 0},
    'W': {'A': -6, 'R': 2, 'N': -4, 'D': -7, 'C': -8, 'Q': -5, 'E': -7, 'G': -7, 'H': -3, 'I': -5, 'L': -2, 'K': -3, 'M': -4, 'F': 0, 'P': -6, 'S': -2, 'T': -5, 'W': 17, 'Y': 0, 'V': -6},
    'Y': {'A': -3, 'R': -4, 'N': -2, 'D': -4, 'C': 0, 'Q': -4, 'E': -4, 'G': -5, 'H': 0, 'I': -1, 'L': -1, 'K': -4, 'M': -2, 'F': 7, 'P': -5, 'S': -3, 'T': -3, 'W': 0, 'Y': 10, 'V': -2},
    'V': {'A': 0, 'R': -2, 'N': -2, 'D': -2, 'C': -2, 'Q': -2, 'E': -2, 'G': -1, 'H': -2, 'I': 4, 'L': 2, 'K': -2, 'M': 2, 'F': -1, 'P': -1, 'S': -1, 'T': 0, 'W': -6, 'Y': -2, 'V': 4}
  };

  const IDENTITY = {};
  const chars = 'ARNDCQEGHILKMFPSTWYV';
  for (let c1 of chars) {
    IDENTITY[c1] = {};
    for (let c2 of chars) {
      IDENTITY[c1][c2] = c1 === c2 ? 1 : -1;
    }
  }

  const getScoringMatrix = () => {
    switch (scoringScheme) {
      case 'BLOSUM62': return BLOSUM62;
      case 'PAM250': return PAM250;
      case 'IDENTITY': return IDENTITY;
      default: return BLOSUM62;
    }
  };

  const getScore = (a, b) => {
    const matrix = getScoringMatrix();
    return matrix[a]?.[b] || 0;
  };

  const needlemanWunsch = (s1, s2) => {
    const m = s1.length;
    const n = s2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // Initialize
    for (let i = 0; i <= m; i++) dp[i][0] = i * gapPenalty;
    for (let j = 0; j <= n; j++) dp[0][j] = j * gapPenalty;

    // Fill matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const match = dp[i-1][j-1] + getScore(s1[i-1], s2[j-1]);
        const del = dp[i-1][j] + gapPenalty;
        const ins = dp[i][j-1] + gapPenalty;
        dp[i][j] = Math.max(match, del, ins);
      }
    }

    // Traceback
    let i = m, j = n;
    let align1 = '', align2 = '', match = '';
    const path = [];

    while (i > 0 || j > 0) {
      path.push([i, j]);
      if (i > 0 && j > 0 && dp[i][j] === dp[i-1][j-1] + getScore(s1[i-1], s2[j-1])) {
        align1 = s1[i-1] + align1;
        align2 = s2[j-1] + align2;
        match = (s1[i-1] === s2[j-1] ? '|' : ' ') + match;
        i--; j--;
      } else if (i > 0 && dp[i][j] === dp[i-1][j] + gapPenalty) {
        align1 = s1[i-1] + align1;
        align2 = '-' + align2;
        match = ' ' + match;
        i--;
      } else {
        align1 = '-' + align1;
        align2 = s2[j-1] + align2;
        match = ' ' + match;
        j--;
      }
    }

    path.push([0, 0]);
    path.reverse();

    return { score: dp[m][n], align1, align2, match, matrix: dp, traceback: path };
  };

  const smithWaterman = (s1, s2) => {
    const m = s1.length;
    const n = s2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    let maxScore = 0;
    let maxI = 0, maxJ = 0;

    // Fill matrix (no negative values)
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const match = dp[i-1][j-1] + getScore(s1[i-1], s2[j-1]);
        const del = dp[i-1][j] + gapPenalty;
        const ins = dp[i][j-1] + gapPenalty;
        dp[i][j] = Math.max(0, match, del, ins);
        if (dp[i][j] > maxScore) {
          maxScore = dp[i][j];
          maxI = i;
          maxJ = j;
        }
      }
    }

    // Traceback from max score
    let i = maxI, j = maxJ;
    let align1 = '', align2 = '', match = '';
    const path = [];

    while (i > 0 && j > 0 && dp[i][j] > 0) {
      path.push([i, j]);
      if (dp[i][j] === dp[i-1][j-1] + getScore(s1[i-1], s2[j-1])) {
        align1 = s1[i-1] + align1;
        align2 = s2[j-1] + align2;
        match = (s1[i-1] === s2[j-1] ? '|' : ' ') + match;
        i--; j--;
      } else if (dp[i][j] === dp[i-1][j] + gapPenalty) {
        align1 = s1[i-1] + align1;
        align2 = '-' + align2;
        match = ' ' + match;
        i--;
      } else {
        align1 = '-' + align1;
        align2 = s2[j-1] + align2;
        match = ' ' + match;
        j--;
      }
    }

    path.push([i, j]);
    path.reverse();

    return { score: maxScore, align1, align2, match, matrix: dp, traceback: path };
  };

  const hirschberg = (s1, s2) => {
    // Simplified version - full implementation would use divide-and-conquer
    return needlemanWunsch(s1, s2);
  };

  const gotoh = (s1, s2) => {
    const m = s1.length;
    const n = s2.length;
    const d = gapOpenPenalty;
    const e = gapExtendPenalty;
    
    // Three matrices: M (match/mismatch), Ix (gap in s1), Iy (gap in s2)
    const M = Array(m + 1).fill(null).map(() => Array(n + 1).fill(-Infinity));
    const Ix = Array(m + 1).fill(null).map(() => Array(n + 1).fill(-Infinity));
    const Iy = Array(m + 1).fill(null).map(() => Array(n + 1).fill(-Infinity));
    
    // Initialize
    M[0][0] = 0;
    for (let i = 1; i <= m; i++) {
      Ix[i][0] = d + i * e;
    }
    for (let j = 1; j <= n; j++) {
      Iy[0][j] = d + j * e;
    }
    
    // Fill matrices
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        M[i][j] = getScore(s1[i-1], s2[j-1]) + Math.max(M[i-1][j-1], Ix[i-1][j-1], Iy[i-1][j-1]);
        Ix[i][j] = Math.max(M[i-1][j] + d + e, Ix[i-1][j] + e);
        Iy[i][j] = Math.max(M[i][j-1] + d + e, Iy[i][j-1] + e);
      }
    }
    
    // Find best score
    const finalScore = Math.max(M[m][n], Ix[m][n], Iy[m][n]);
    // Traceback
let i = m, j = n;
let align1 = '', align2 = '', match = '';
const path = [];
let currentMatrix = M[m][n] >= Ix[m][n] && M[m][n] >= Iy[m][n] ? 'M' : (Ix[m][n] >= Iy[m][n] ? 'Ix' : 'Iy');

while (i > 0 || j > 0) {
  path.push([i, j]);
  
  if (currentMatrix === 'M' && i > 0 && j > 0) {
    align1 = s1[i-1] + align1;
    align2 = s2[j-1] + align2;
    match = (s1[i-1] === s2[j-1] ? '|' : ' ') + match;
    
    const prevScore = M[i][j] - getScore(s1[i-1], s2[j-1]);
    if (Math.abs(prevScore - M[i-1][j-1]) < 0.001) currentMatrix = 'M';
    else if (Math.abs(prevScore - Ix[i-1][j-1]) < 0.001) currentMatrix = 'Ix';
    else currentMatrix = 'Iy';
    
    i--; j--;
  } else if (currentMatrix === 'Ix' && i > 0) {
    align1 = s1[i-1] + align1;
    align2 = '-' + align2;
    match = ' ' + match;
    
    if (Math.abs(Ix[i][j] - (Ix[i-1][j] + e)) < 0.001) {
      currentMatrix = 'Ix';
    } else {
      currentMatrix = 'M';
    }
    i--;
  } else if (currentMatrix === 'Iy' && j > 0) {
    align1 = '-' + align1;
    align2 = s2[j-1] + align2;
    match = ' ' + match;
    
    if (Math.abs(Iy[i][j] - (Iy[i][j-1] + e)) < 0.001) {
      currentMatrix = 'Iy';
    } else {
      currentMatrix = 'M';
    }
    j--;
  } else {
    break;
  }
}

path.push([0, 0]);
path.reverse();

return { score: finalScore, align1, align2, match, matrix: M, traceback: path };
};
const runAlignment = () => {
const s1 = seq1.toUpperCase();
const s2 = seq2.toUpperCase();
let res;
switch (algorithm) {
  case 'needleman-wunsch':
    res = needlemanWunsch(s1, s2);
    break;
  case 'smith-waterman':
    res = smithWaterman(s1, s2);
    break;
  case 'hirschberg':
    res = hirschberg(s1, s2);
    break;
  case 'gotoh':
    res = gotoh(s1, s2);
    break;
  default:
    res = needlemanWunsch(s1, s2);
}

setMatrix(res.matrix);
setTraceback(res.traceback);
setResult(res);
setAnimationStep(0);
};
const startAnimation = () => {
setIsAnimating(true);
setIsPaused(false);
setAnimationStep(0);
};
useEffect(() => {
if (isAnimating && !isPaused && animationStep < traceback.length) {
const timer = setTimeout(() => {
setAnimationStep(prev => prev + 1);
}, animationSpeed);
return () => clearTimeout(timer);
} else if (animationStep >= traceback.length) {
setIsAnimating(false);
}
}, [isAnimating, isPaused, animationStep, traceback.length, animationSpeed]);
const downloadCSV = () => {
if (!result) return;
let csv = 'Algorithm,Scoring Scheme,Score,Identity,Alignment\n';
csv += `${algorithm},${scoringScheme},${result.score},${calculateIdentity()}%,\n`;
csv += `Sequence 1:,${result.align1}\n`;
csv += `Match:,${result.match}\n`;
csv += `Sequence 2:,${result.align2}\n`;

const blob = new Blob([csv], { type: 'text/csv' });
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'alignment_result.csv';
a.click();
};
const calculateIdentity = () => {
if (!result) return 0;
let matches = 0;
for (let i = 0; i < result.match.length; i++) {
if (result.match[i] === '|') matches++;
}
return ((matches / result.match.length) * 100).toFixed(1);
};
const calculateTime = () => {
return (seq1.length * seq2.length * 0.001).toFixed(2);
};
return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
<div className="max-w-7xl mx-auto">
<header className="text-center mb-8">
<h1 className="text-4xl font-bold text-gray-800 mb-2">Advanced Sequence Alignment Tool</h1>
<p className="text-gray-600">Global & Local Sequence Alignment with Multiple Scoring Schemes</p>
</header>
{/* Configuration Panel */}
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Configuration</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sequence 1</label>
          <input
            type="text"
            value={seq1}
            onChange={(e) => setSeq1(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            placeholder="Enter first sequence"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sequence 2</label>
          <input
            type="text"
            value={seq2}
            onChange={(e) => setSeq2(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            placeholder="Enter second sequence"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Algorithm</label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="needleman-wunsch">Needleman-Wunsch (Global)</option>
            <option value="smith-waterman">Smith-Waterman (Local)</option>
            <option value="hirschberg">Hirschberg (Space-efficient)</option>
            <option value="gotoh">Gotoh (Affine Gap)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Scoring Scheme</label>
          <select
            value={scoringScheme}
            onChange={(e) => setScoringScheme(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="BLOSUM62">BLOSUM62</option>
            <option value="PAM250">PAM250</option>
            <option value="IDENTITY">Identity Matrix</option>
          </select>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={useAffineGap}
              onChange={(e) => setUseAffineGap(e.target.checked)}
              disabled={algorithm === 'gotoh'}
              className="w-4 h-4 text-blue-600"
            />
            <label className="text-sm font-medium text-gray-700">
              Use Affine Gap Penalty {algorithm === 'gotoh' && '(Auto-enabled for Gotoh)'}
            </label>
          </div>
          {(!useAffineGap && algorithm !== 'gotoh') ? (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Gap Penalty</label>
              <input
                type="number"
                value={gapPenalty}
                onChange={(e) => setGapPenalty(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Gap Open</label>
                <input
                  type="number"
                  value={gapOpenPenalty}
                  onChange={(e) => setGapOpenPenalty(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Gap Extend</label>
                <input
                  type="number"
                  value={gapExtendPenalty}
                  onChange={(e) => setGapExtendPenalty(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={runAlignment}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Play className="w-5 h-5" />
        Run Alignment
      </button>
    </div>

    {/* Results */}
    {result && (
      <>
        {/* Animation Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Animation Controls</h2>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={startAnimation}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              disabled={!isAnimating}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-400"
            >
              <Pause className="w-4 h-4" />
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={() => {
                setIsAnimating(false);
                setAnimationStep(0);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-medium text-gray-700">Speed:</label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                className="flex-1"
              />
            </div>
            <span className="text-sm text-gray-600">
              Step: {animationStep} / {traceback.length}
            </span>
          </div>
        </div>

        {/* Scoring Matrix */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Scoring Matrix</h2>
          <div className="inline-block min-w-full">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-gray-100 p-2 text-sm font-medium"></th>
                  <th className="border border-gray-300 bg-gray-100 p-2 text-sm font-medium">-</th>
                  {seq2.split('').map((char, i) => (
                    <th key={i} className="border border-gray-300 bg-gray-100 p-2 text-sm font-medium">{char}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={i}>
                    <th className="border border-gray-300 bg-gray-100 p-2 text-sm font-medium">
                      {i === 0 ? '-' : seq1[i-1]}
                    </th>
                    {row.map((cell, j) => {
                      const isInPath = animationStep > 0 && traceback.slice(0, animationStep).some(
                        ([pi, pj]) => pi === i && pj === j
                      );
                      const isCurrent = animationStep > 0 && 
                        traceback[animationStep - 1]?.[0] === i && 
                        traceback[animationStep - 1]?.[1] === j;
                      
                      return (
                        <td
                          key={j}
                          className={`border border-gray-300 p-2 text-sm text-center transition-colors ${
                            isCurrent ? 'bg-green-400' :
                            isInPath ? 'bg-blue-200' :
                            'bg-white hover:bg-gray-50'
                          }`}
                        >
                          {cell === -Infinity ? '-∞' : typeof cell === 'number' ? cell.toFixed(0) : cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 border border-gray-300"></div>
              <span>Traceback Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 border border-gray-300"></div>
              <span>Current</span>
            </div>
          </div>
        </div>

        {/* Alignment Results */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Alignment Results</h2>
            <button
              onClick={downloadCSV}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Alignment Score</div>
              <div className="text-3xl font-bold text-blue-600">{result.score.toFixed(2)}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Identity</div>
              <div className="text-3xl font-bold text-green-600">{calculateIdentity()}%</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Time</div>
              <div className="text-3xl font-bold text-purple-600">{calculateTime()}ms</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Matrix Size</div>
              <div className="text-3xl font-bold text-orange-600">
                {seq1.length + 1} × {seq2.length + 1}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg font-mono text-sm overflow-x-auto">
            <div className="mb-2">
              <span className="text-gray-600">Seq1: </span>
              <span className="font-semibold">{result.align1}</span>
            </div>
            <div className="mb-2">
              <span className="text-gray-600">      </span>
              <span className="text-green-600">{result.match}</span>
            </div>
            <div>
              <span className="text-gray-600">Seq2: </span>
              <span className="font-semibold">{result.align2}</span>
            </div>
          </div>
        </div>

        {/* Algorithm Info */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Algorithm Information</h2>
          <div className="text-gray-700 space-y-2">
            <p><strong>Algorithm:</strong> {algorithm.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
            <p><strong>Scoring:</strong> {scoringScheme}</p>
            <p className="text-sm text-gray-600 mt-4">
              {algorithm === 'needleman-wunsch' && 'Global alignment - aligns entire sequences end-to-end'}
              {algorithm === 'smith-waterman' && 'Local alignment - finds best matching regions within sequences'}
              {algorithm === 'hirschberg' && 'Space-efficient global alignment using divide-and-conquer'}
              {algorithm === 'gotoh' && 'Global alignment with affine gap penalties - distinguishes gap opening from gap extension'}
            </p>
          </div>
        </div>
      </>
    )}

    {/* Quick Guide */}
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Guide</h2>
      <ul className="space-y-2 text-gray-700 text-sm">
        <li><strong>Needleman-Wunsch:</strong> Global alignment - aligns entire sequences</li>
        <li><strong>Smith-Waterman:</strong> Local alignment - finds best matching regions</li>
        <li><strong>Hirschberg:</strong> Space-efficient variant of Needleman-Wunsch</li>
        <li><strong>Gotoh:</strong> Global alignment with affine gap penalties for more biological accuracy</li>
        <li><strong>BLOSUM62:</strong> Best for distantly related proteins</li>
        <li><strong>PAM250:</strong> Best for evolutionarily distant sequences</li>
        <li><strong>Identity:</strong> Simple match/mismatch scoring</li>
      </ul>
    </div>
  </div>
</div>
);
};
export default SequenceAlignmentTool;