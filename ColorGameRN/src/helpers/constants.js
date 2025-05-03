export const winText = [
  'Great Job!',
  "You're Amazing!",
  'Well Done!',
  'Cool!',
  'Level Up'
];

// Constants for Puzzle Mode
export const PUZZLE_MODE = {
  // Matching rules
  MIN_MATCH_LENGTH: 3,            // Minimum length for a match
  
  // Animation delays - ensuring visibility while maintaining flow
  MATCH_ANIMATION_DELAY: 400,     // Delay for match animations
  GRAVITY_ANIMATION_DELAY: 400,   // Delay for gravity animations
  CASCADE_ANIMATION_DELAY: 400,   // Delay between cascade steps
  NEW_BLOCK_ANIMATION_DELAY: 400, // Delay for new block animations
  
  // Scoring
  BASE_POINTS: 10,                // Base points for a minimum match
  BONUS_POINTS_PER_EXTRA: 5,      // Bonus points for each block beyond minimum
  CASCADE_BONUS_MULTIPLIER: 1.5,  // Score multiplier for cascade matches
  
  // Limits
  MAX_CASCADE_ITERATIONS: 3,      // Maximum number of cascade iterations
};

export const colorArrays = {
  '0': [
    {
      backgroundColor: '#6A0000',
      borderColor: '#390707'
    },
    {
      backgroundColor: '#976803',
      borderColor: '#664212'
    },
    {
      backgroundColor: '#9CA503',
      borderColor: '#718425'
    },
    {
      backgroundColor: '#61A554',
      borderColor: '#2F871E'
    },
    {
      backgroundColor: '#238C80',
      borderColor: '#076A5F'
    },
    {
      backgroundColor: '#006FA4',
      borderColor: '#0F3660'
    },
    {
      backgroundColor: '#4101C8',
      borderColor: '#440365'
    },
    {
      backgroundColor: '#7100AC',
      borderColor: '#2A0B6E'
    }
  ],
  '1': [
    {
      backgroundColor: '#2910A9',
      borderColor: '#B19DFD'
    },
    {
      backgroundColor: '#8604CD',
      borderColor: '#EDB8FC'
    },
    {
      backgroundColor: '#D600CA',
      borderColor: '#FFC6F5'
    },
    {
      backgroundColor: '#FF5A5A',
      borderColor: '#FFC7D7'
    },
    {
      backgroundColor: '#FF9440',
      borderColor: '#FEE578'
    },
    {
      backgroundColor: '#93C039',
      borderColor: '#CFF583'
    },
    {
      backgroundColor: '#00A8E1',
      borderColor: '#97EFF9'
    },
    {
      backgroundColor: '#3569E9',
      borderColor: '#68BFFD'
    }
  ],
  '2': [
    {
      backgroundColor: '#F9A400',
      borderColor: '#FFEBB9'
    },
    {
      backgroundColor: '#E176DE',
      borderColor: '#F7D0F6'
    },
    {
      backgroundColor: '#BBCB00',
      borderColor: '#F3F7B8'
    },
    {
      backgroundColor: '#9A74EB',
      borderColor: '#CBB9F1'
    },
    {
      backgroundColor: '#14D6C2',
      borderColor: '#9BEBE3'
    },
    {
      backgroundColor: '#0E7EC3',
      borderColor: '#62B1E1'
    },
    {
      backgroundColor: '#1CA9FF',
      borderColor: '#98D8FF'
    },
    {
      backgroundColor: '#FF7F7F',
      borderColor: '#FFC3BC'
    }
  ],
  '3': [
    {
      backgroundColor: '#2BA8D5',
      borderColor: '#5EC5EA'
    },
    {
      backgroundColor: '#85CEA6',
      borderColor: '#BEE3CF'
    },
    {
      backgroundColor: '#FBE16A',
      borderColor: '#FFF0AC'
    },
    {
      backgroundColor: '#FAA253',
      borderColor: '#FBCF88'
    },
    {
      backgroundColor: '#F05F64',
      borderColor: '#FFA7AA'
    },
    {
      backgroundColor: '#132592',
      borderColor: '#6072E5'
    },
    {
      backgroundColor: '#5491DC',
      borderColor: '#96B6F5'
    },
    {
      backgroundColor: '#9AE4FF',
      borderColor: '#C6F0FF'
    }
  ],
  '4': [
    {
      backgroundColor: '#2910A9',
      borderColor: '#7055FF'
    },
    {
      backgroundColor: '#8604CD',
      borderColor: '#BB3FFF'
    },
    {
      backgroundColor: '#D600CA',
      borderColor: '#FF4AF5'
    },
    {
      backgroundColor: '#FF5A5A',
      borderColor: '#FF9F4F'
    },
    {
      backgroundColor: '#FF9440',
      borderColor: '#FFE200'
    },
    {
      backgroundColor: '#93C039',
      borderColor: '#A7DF35'
    },
    {
      backgroundColor: '#04AEC4',
      borderColor: '#3CD7E9'
    },
    {
      backgroundColor: '#3569E9',
      borderColor: '#3FAFFF'
    }
  ]
};