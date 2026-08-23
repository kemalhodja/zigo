import type { PipeType } from "./pipe-cell";

const PRESET_LEVELS: { type: PipeType; correctRotation: number }[][][] = [
  [
    [
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "source",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 270
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "target",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 180
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ]
  ],
  [
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 180
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "source",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "target",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ],
    [
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "empty",
        "correctRotation": 0
      },
      {
        "type": "corner",
        "correctRotation": 0
      },
      {
        "type": "straight",
        "correctRotation": 90
      },
      {
        "type": "corner",
        "correctRotation": 270
      },
      {
        "type": "empty",
        "correctRotation": 0
      }
    ]
  ]
];

export { PRESET_LEVELS };
