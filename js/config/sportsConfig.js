/**
 * sportsConfig.js
 * Modular configuration for sports and exercises.
 * Includes Volleyball Bump, Volleyball Set, Squats, and Jumping Jacks.
 * Also manages Room (ห้อง 1-99) configuration for elementary schools.
 */

// Default room list: ห้อง 1 ถึง ห้อง 99
export function getDefaultRooms() {
  try {
    const customRooms = localStorage.getItem("ku_custom_rooms");
    if (customRooms) {
      return JSON.parse(customRooms);
    }
  } catch (e) {
    console.error("Error loading custom rooms:", e);
  }
  // Default generator: ห้อง 1 ถึง ห้อง 20 (สามารถเพิ่มได้ภายหลังผ่าน Admin Dashboard)
  const rooms = [];
  for (let i = 1; i <= 20; i++) {
    rooms.push(`ห้อง ${i}`);
  }
  return rooms;
}

export function saveCustomRooms(roomArray) {
  localStorage.setItem("ku_custom_rooms", JSON.stringify(roomArray));
}

export const SPORTS_CONFIG = [
  {
    id: "volleyball_bump",
    name: "อันเดอร์บอล (Bump / Dig)",
    sport: "Volleyball",
    badge: "🏐 ท่าอันเดอร์",
    icon: "🏐",
    description: "ย่อเข่าเป็นจังหวะ แขนประกบเหยียดตึงทั้งสองข้างเพื่อรับและส่งลูก!",
    instructions: [
      "1. ถอยห่างให้กล้องเห็นทั้งตัว (ศีรษะถึงข้อเท้า)",
      "2. ประสานมือ ยื่นแขนไปข้างหน้า แขนต้องเหยียดตึงเสมอ",
      "3. จังหวะย่อ: ย่อเข่าลงคล้ายนั่งเก้าอี้",
      "4. จังหวะส่ง: ยืดเข่าขึ้นโดยแขนยังคงตึงตลอดเวลา"
    ],
    targetReps: 12,
    timeLimit: 50,
    pointsPerRep: 20,
    requiresFullBody: true,
    rules: {
      armsStraight: {
        minAngle: 150,
        warningVoice: "เหยียดแขนให้ตึง!"
      },
      handsTogether: {
        maxDistanceRatio: 0.38,
        warningVoice: "ประกบมือชิดกัน!"
      },
      repetition: {
        type: "knee_bend",
        downAngle: 125,
        upAngle: 155,
        cueDown: "ย่อเข่า!",
        cueUp: "ส่งแรงขึ้น!"
      }
    }
  },
  {
    id: "volleyball_set",
    name: "เซ็ตบอล (Overhead Set)",
    sport: "Volleyball",
    badge: "🙌 ท่าเซ็ตบอล",
    icon: "🏐",
    description: "ยกมือเหนือหน้าผาก กางนิ้วเป็นรูปสามเหลี่ยม ย่อเข่าแล้วสปริงตัวผลักบอลขึ้นด้านบน!",
    instructions: [
      "1. ถอยให้กล้องเห็นทั้งตัว ยกมือทั้งสองข้างขึ้นเหนือศีรษะ/หน้าผาก",
      "2. กางข้อศอกออกเล็กน้อย มือทั้งสองข้างชิดกันเป็นรูปถ้วย/สามเหลี่ยม",
      "3. จังหวะเตรียม: ย่อเข่าลงเล็กน้อย มือค้างไว้เหนือหน้าผาก",
      "4. จังหวะเซ็ต: ยืดเข่าขึ้นพร้อมเหยียดแขนผลักบอลขึ้นฟ้า"
    ],
    targetReps: 12,
    timeLimit: 50,
    pointsPerRep: 20,
    requiresFullBody: true,
    rules: {
      handsAboveHead: {
        warningVoice: "ยกมือขึ้นระดับหน้าผาก!"
      },
      handsCupShape: {
        maxDistanceRatio: 0.55,
        warningVoice: "มือชิดกันเหนือศีรษะ!"
      },
      repetition: {
        type: "set_push",
        downElbowAngle: 115,  // Elbows bent while preparing
        upElbowAngle: 145,    // Elbows extended pushing ball up
        downKneeAngle: 135,   // Knee cushioning
        upKneeAngle: 155,
        cueDown: "ย่อรับแรง!",
        cueUp: "ผลักบอลขึ้น!"
      }
    }
  },
  {
    id: "volleyball_serve_under",
    name: "เสิร์ฟลูกมือล่าง (Underhand Serve)",
    sport: "Volleyball",
    badge: "🎯 เสิร์ฟมือล่าง",
    icon: "🏐",
    description: "มินิเกมฝึกเสิร์ฟลูกมือเดียวล่าง: ถือบอลระดับเอว ง้างแขนไปด้านหลังแล้วเหวี่ยงสวิงเสยส่งบอลข้ามตาข่าย!",
    instructions: [
      "1. ยืนหันเฉียงให้กล้องเห็นช่วงลำตัวและแขนชัดเจน",
      "2. มือข้างหนึ่งถือบอลระดับเอวหรือสะโพก",
      "3. จังหวะง้าง: แขนอีกข้างง้างเหวี่ยงไปด้านหลัง ลำตัวและเข่าย่อลงเล็กน้อย",
      "4. จังหวะเสิร์ฟ: สวิงแขนจากหลังเหวี่ยงเสยส่งบอลไปข้างหน้า!"
    ],
    targetReps: 8,
    timeLimit: 50,
    pointsPerRep: 25,
    requiresFullBody: false,
    rules: {
      repetition: {
        type: "underhand_serve",
        cueBack: "ง้างแขนไปด้านหลัง!",
        cueHit: "เหวี่ยงเสยส่งบอล!"
      }
    }
  },
  {
    id: "volleyball_serve_over",
    name: "เสิร์ฟลูกมือบน (Overhand Serve)",
    sport: "Volleyball",
    badge: "⚡ เสิร์ฟมือบน",
    icon: "🏐",
    description: "มินิเกมฝึกเสิร์ฟลูกมือบน (Overhand Serve): ยกง้างข้อศอกระดับใบหู ย่อเข่าเล็กน้อย แล้วสปริงตัวฟาดฝ่ามือส่งบอลข้ามเน็ต!",
    instructions: [
      "1. ยืนเตรียมพร้อม ให้กล้องเห็นตั้งแต่ช่วงอก แขน และศีรษะชัดเจน",
      "2. จังหวะง้าง: ยกข้อศอกง้างไปด้านหลังระดับใบหูหรือหลังศีรษะ",
      "3. จังหวะตี: ฟาดแขนเหยียดตึงตีบอลที่จุดสูงสุดเหนือศีรษะ",
      "4. ตีให้แขนเหยียดขึ้นสูงสุดเพื่อนับ 1 ครั้ง"
    ],
    targetReps: 8,
    timeLimit: 50,
    pointsPerRep: 25,
    requiresFullBody: false,
    rules: {
      repetition: {
        type: "overhand_serve",
        cueCock: "ง้างศอกยกแขน!",
        cueSmash: "ฟาดบอลเหนือศีรษะ!"
      }
    }
  }
];

// ==========================================
// 10 BASIC STATIC STRETCHING POSES (ท่ายืดเหยียดกล้ามเนื้อ 10 ท่าพื้นฐาน)
// แต่ละท่าได้ คะแนน exp 5
// ==========================================
export const STRETCHING_EXERCISES = [
  {
    id: "stretch_neck",
    name: "ยืดกล้ามเนื้อคอ (Neck Stretch)",
    sport: "Stretching",
    badge: "🧘 ยืดกล้ามเนื้อ",
    icon: "🧘",
    description: "เอียงศีรษะไปด้านข้างช้าๆ ใช้มือช่วยประคองเบาๆ ยืดกล้ามเนื้อลำคอและบ่า",
    instructions: [
      "1. ยืนตัวตรง ผ่อนคลายหัวไหล่ทั้งสองข้าง",
      "2. เอียงศีรษะไปทางขวาช้าๆ ค้างไว้",
      "3. สลับเอียงศีรษะไปทางซ้ายช้าๆ"
    ],
    targetReps: 5,
    timeLimit: 30,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: false,
    rules: {
      repetition: {
        type: "overhead_reach",
        cueUp: "เอียงศีรษะยืดคอ!",
        cueDown: "กลับสู่ท่าตรง!"
      }
    }
  },
  {
    id: "stretch_shoulder_cross",
    name: "ยืดหัวไหล่ข้ามลำตัว (Cross-Body Shoulder Stretch)",
    sport: "Stretching",
    badge: "🧘 ยืดกล้ามเนื้อ",
    icon: "💪",
    description: "ยกแขนข้างหนึ่งพาดขวางหน้าอก ใช้แขนอีกข้างดึงแนบลำตัว ยืดหัวไหล่และสะบัก",
    instructions: [
      "1. ยกแขนขวาพาดขวางหน้าอกไปทางซ้าย",
      "2. ใช้แขนซ้ายช่วยดึงท่อนแขนขวาชิดลำตัว",
      "3. ค้างไว้แล้วสลับข้างอย่างนุ่มนวล"
    ],
    targetReps: 5,
    timeLimit: 30,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: false,
    rules: {
      repetition: {
        type: "arm_swing",
        cueBack: "ดึงแขนแนบอกยืดไหล่!",
        cueForward: "ผ่อนแขนสบายๆ!"
      }
    }
  },
  {
    id: "stretch_triceps",
    name: "ยืดหลังแขนและสะบัก (Overhead Triceps Stretch)",
    sport: "Stretching",
    badge: "🧘 ยืดกล้ามเนื้อ",
    icon: "🙆",
    description: "ชูมือขึ้นเหนือศีรษะ พับข้อศอกไปด้านหลัง มืออีกข้างจับข้อศอกดึงเบาๆ",
    instructions: [
      "1. ยกแขนขึ้นเหนือศีรษะแล้วงอศอกแตะกลางหลัง",
      "2. ใช้มืออีกข้างประคองข้อศอกดึงไปด้านหลังเบาๆ",
      "3. ยืดอกขึ้น ค้างไว้แล้วสลับข้าง"
    ],
    targetReps: 5,
    timeLimit: 30,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: false,
    rules: {
      repetition: {
        type: "overhead_reach",
        cueUp: "ยกศอกพับไปด้านหลัง!",
        cueDown: "ลดแขนลงสบายๆ!"
      }
    }
  },
  {
    id: "stretch_chest_biceps",
    name: "ยืดกล้ามเนื้ออกและไหล่ (Chest & Shoulder Opener)",
    sport: "Stretching",
    badge: "🧘 ยืดกล้ามเนื้อ",
    icon: "👐",
    description: "ประสานมือด้านหลัง แอ่นอกและดึงไหล่ไปด้านหลัง ยืดแผงอกให้เปิดกว้าง",
    instructions: [
      "1. ประสานมือไว้ด้านหลังสะโพก",
      "2. ดึงแขนไปด้านหลังพร้อมยืดอกเปิดกว้าง",
      "3. หายใจเข้าลึกๆ ค้างไว้แล้วผ่อนคลาย"
    ],
    targetReps: 5,
    timeLimit: 30,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: false,
    rules: {
      repetition: {
        type: "arm_swing",
        cueBack: "เปิดอกดึงมือไปข้างหลัง!",
        cueForward: "ผ่อนแขนกลับมา!"
      }
    }
  },
  {
    id: "stretch_side_bend",
    name: "ยืดลำตัวด้านข้าง (Standing Side Stretch)",
    sport: "Stretching",
    badge: "🧘 ยืดกล้ามเนื้อ",
    icon: "🌿",
    description: "ยืนตรง ชูแขนข้างหนึ่งขึ้นแล้วเอียงลำตัวไปด้านตรงข้าม ยืดสีข้างและเอว",
    instructions: [
      "1. ยืนตรงแยกเท้าเล็กน้อย ชูแขนขวาขึ้นฟ้า",
      "2. เอียงลำตัวไปทางซ้ายจนรู้สึกตึงสีข้าง",
      "3. กลับสู่ท่ายืนตรง แล้วสลับทำข้างซ้าย"
    ],
    targetReps: 5,
    timeLimit: 30,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "overhead_reach",
        cueUp: "เอียงตัวยืดสีข้าง!",
        cueDown: "กลับสู่ท่ายืนตรง!"
      }
    }
  },
  {
    id: "stretch_upper_back",
    name: "ยืดหลังส่วนบนและสะบัก (Upper Back Stretch)",
    sport: "Stretching",
    badge: "🧘 ยืดกล้ามเนื้อ",
    icon: "🤲",
    description: "ประสานมือยื่นไปข้างหน้า โก่งหลังส่วนบนเล็กน้อย ดึงสะบักแยกออกจากกัน",
    instructions: [
      "1. ประสานนิ้วมือทั้งสองข้าง ยื่นแขนตรงไปข้างหน้า",
      "2. ก้มศีรษะลงเล็กน้อย โก่งหลังบนยืดสะบักออก",
      "3. ค้างไว้ 3-5 วินาทีแล้วดึงมือกลับระดับอก"
    ],
    targetReps: 5,
    timeLimit: 30,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: false,
    rules: {
      repetition: {
        type: "overhead_reach",
        cueUp: "ประสานมือยื่นไปข้างหน้า!",
        cueDown: "ดึงมือกลับระดับอก!"
      }
    }
  },
  {
    id: "stretch_quads",
    name: "ยืดหน้าขาและต้นขา (Standing Quad Stretch)",
    sport: "Stretching",
    badge: "🧘 ยืดกล้ามเนื้อ",
    icon: "🦵",
    description: "ยืนขาเดียว พับขาข้างหนึ่งไปด้านหลัง ใช้มือจับข้อเท้าดึงชิดสะโพก ยืดต้นขาด้านหน้า",
    instructions: [
      "1. ยืนตรง ทรงตัวด้วยขาข้างหนึ่ง",
      "2. พับขาอีกข้างไปข้างหลัง ใช้มือจับข้อเท้าดึงชิดสะโพก",
      "3. ยืดตัวตรง ค้างไว้แล้วสลับข้าง"
    ],
    targetReps: 5,
    timeLimit: 30,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "knee_bend",
        cueDown: "พับข้อเท้ายืดหน้าขา!",
        cueUp: "วางเท้าลงยืนตรง!"
      }
    }
  },
  {
    id: "stretch_hamstrings",
    name: "ยืดหลังขาและข้อพับ (Standing Hamstring Stretch)",
    sport: "Stretching",
    badge: "🧘 ยืดกล้ามเนื้อ",
    icon: "🦶",
    description: "ก้าวขาข้างหนึ่งไปข้างหน้า ปลายเท้ากระดกขึ้น ย่อสะโพกหลังลง ยืดหลังขา",
    instructions: [
      "1. ก้าวขาขวาไปข้างหน้าเล็กน้อย ส้นเท้าแตะพื้นกระดกปลายเท้าขึ้น",
      "2. ย่อเข่าซ้ายลง ดันสะโพกไปด้านหลัง ก้มตัวแตะปลายเท้าขวา",
      "3. ยืดตัวขึ้นแล้วสลับทำข้างซ้าย"
    ],
    targetReps: 5,
    timeLimit: 30,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "knee_bend",
        cueDown: "ก้มแตะปลายเท้ายืดหลังขา!",
        cueUp: "ยืดตัวขึ้นตรง!"
      }
    }
  },
  {
    id: "stretch_calf",
    name: "ยืดน่องและเอ็นร้อยหวาย (Calf Runner Stretch)",
    sport: "Stretching",
    badge: "🧘 ยืดกล้ามเนื้อ",
    icon: "🏃",
    description: "ก้าวขาข้างหนึ่งไปด้านหลัง ส้นเท้าแตะพื้น ขาหลังเหยียดตึง ยืดน่อง",
    instructions: [
      "1. ก้าวขาขวาไปข้างหลัง ขาเหยียดตึง ส้นเท้ากดแนบพื้น",
      "2. ย่อเข่าซ้ายไปข้างหน้าเล็กน้อย รู้สึกตึงที่น่องขวา",
      "3. ค้างไว้แล้วสลับข้าง"
    ],
    targetReps: 5,
    timeLimit: 30,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "knee_bend",
        cueDown: "ก้าวขายาวส้นเท้าชิดพื้น!",
        cueUp: "ก้าวกลับมายืนตรง!"
      }
    }
  },
  {
    id: "stretch_groin",
    name: "ยืดขาหนีบและสะโพก (Side Lunge Groin Stretch)",
    sport: "Stretching",
    badge: "🧘 ยืดกล้ามเนื้อ",
    icon: "🧘",
    description: "ยืนกางขากว้าง ย่อเข่าข้างหนึ่งลง ขาอีกข้างเหยียดตึง ยืดต้นขาด้านใน",
    instructions: [
      "1. ยืนกางขาให้กว้างกว่าช่วงไหล่ ปลายเท้าชี้ตรง",
      "2. ย่อเข่าข้างหนึ่งลง ขาอีกข้างเหยียดตรงจนรู้สึกตึงขาหนีบ",
      "3. ดันตัวกลับขึ้นตรงแล้วย่อสลับอีกข้าง"
    ],
    targetReps: 5,
    timeLimit: 30,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "knee_bend",
        cueDown: "ย่อข้างยืดขาหนีบ!",
        cueUp: "ดันตัวกลับมายืนตรง!"
      }
    }
  }
];

// ==========================================
// 10 BASIC DYNAMIC STRETCHING EXERCISES (ท่าออกกำลังกายพื้นฐาน Dynamic Stretching 10 ท่า)
// แต่ละท่าได้ คะแนน exp 5
// ==========================================
export const DYNAMIC_WARMUP_EXERCISES = [
  {
    id: "dynamic_arm_circles",
    name: "หมุนแขนวงกลมวอร์มข้อต่อ (Arm Circles)",
    sport: "Warm-up",
    badge: "🔥 Dynamic Warm-up",
    icon: "🔄",
    description: "กางแขนออกระดับไหล่แล้วหมุนแขนเป็นวงกลมไปข้างหน้าและข้างหลัง วอร์มหัวไหล่",
    instructions: [
      "1. ยืนตรง กางแขนทั้งสองข้างออกด้านข้างระดับหัวไหล่",
      "2. หมุนแขนเป็นวงกลมไปข้างหน้า 5 ครั้ง",
      "3. หมุนแขนเป็นวงกลมกลับไปข้างหลัง 5 ครั้ง"
    ],
    targetReps: 10,
    timeLimit: 35,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: false,
    rules: {
      repetition: {
        type: "arm_swing",
        cueBack: "หมุนแขนไปข้างหลัง!",
        cueForward: "หมุนแขนมาข้างหน้า!"
      }
    }
  },
  {
    id: "dynamic_high_knees",
    name: "ยกเข่าสูงจังหวะคึกคัก (High Knees March)",
    sport: "Warm-up",
    badge: "🔥 Dynamic Warm-up",
    icon: "🦵",
    description: "ยืนย่ำเท้า ยกเข่าขึ้นสูงระดับสะโพกสลับซ้าย-ขวาเป็นจังหวะ ปลุกพลังขาก่อนแข่ง",
    instructions: [
      "1. ยืนตรงหันหน้าเข้าหากล้อง",
      "2. ยกเข่าขวาขึ้นสูงระดับสะโพกพร้อมแกว่งแขนตรงข้าม",
      "3. สลับยกเข่าซ้ายขึ้นสูงอย่างต่อเนื่องและคล่องแคล่ว"
    ],
    targetReps: 10,
    timeLimit: 35,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "high_knees",
        kneeAngleThreshold: 100,
        hipAngleThreshold: 110,
        cueUp: "ยกเข่าสูงขึ้นอีก!",
        cueDown: "สลับขาต่อเนื่อง!"
      }
    }
  },
  {
    id: "dynamic_butt_kicks",
    name: "เตะส้นเท้าแตะก้น (Butt Kicks)",
    sport: "Warm-up",
    badge: "🔥 Dynamic Warm-up",
    icon: "👟",
    description: "วิ่งย่ำอยู่กับที่ ดีดส้นเท้าแตะก้นสลับข้าง ปลุกกล้ามเนื้อต้นขาด้านหน้าและหัวเข่า",
    instructions: [
      "1. ยืนตรง เท้าชิดกัน แกว่งแขนผ่อนคลาย",
      "2. ดีดส้นเท้าขวาขึ้นแตะก้น",
      "3. สลับดีดส้นเท้าซ้ายขึ้นอย่างต่อเนื่อง"
    ],
    targetReps: 10,
    timeLimit: 35,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "knee_bend",
        downAngle: 125,
        upAngle: 155,
        cueDown: "เตะส้นเท้าชิดก้น!",
        cueUp: "สลับเท้าต่อเนื่อง!"
      }
    }
  },
  {
    id: "dynamic_jumping_jacks",
    name: "กระโดดตบกางแขนกางขา (Jumping Jacks Warm-up)",
    sport: "Warm-up",
    badge: "🔥 Dynamic Warm-up",
    icon: "⭐",
    description: "กระโดดกางแขนกางขาเป็นรูปดาว แล้วกระโดดหุบขากลับสู่ท่ายืนตรง กระตุ้นอัตราการเต้นหัวใจ",
    instructions: [
      "1. เริ่มต้นยืนตรง แขนแนบลำตัว",
      "2. กระโดดกางขาออกพร้อมตบมือเหนือศีรษะ",
      "3. กระโดดกลับสู่ท่ายืนตรงเพื่อนับ 1 ครั้ง"
    ],
    targetReps: 10,
    timeLimit: 35,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "jumping_jack",
        armSpreadAngle: 125,
        cueUp: "กางแขนออก!",
        cueDown: "หุบแขนแนบลำตัว!"
      }
    }
  },
  {
    id: "dynamic_squats",
    name: "สควอทเบาๆ อุ่นข้อเข่า (Gentle Squats)",
    sport: "Warm-up",
    badge: "🔥 Dynamic Warm-up",
    icon: "🏋️",
    description: "ยืนกางขาเท่าช่วงไหล่ ย่อสะโพกลงเป็นจังหวะแล้วยืนตัวตรง เตรียมพร้อมกระโดดบล็อกและเสิร์ฟ",
    instructions: [
      "1. ยืนกางขาเท่าความกว้างของไหล่",
      "2. ดันสะโพกไปด้านหลัง ย่อตัวลงจนเข่างอ",
      "3. ดันส้นเท้าส่งแรงขึ้นยืนตัวตรง"
    ],
    targetReps: 8,
    timeLimit: 35,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "knee_bend",
        downAngle: 125,
        upAngle: 155,
        cueDown: "ย่อสะโพกลง!",
        cueUp: "ยืดตัวยืนตรง!"
      }
    }
  },
  {
    id: "dynamic_torso_twist",
    name: "บิดลำตัวสลับข้าง (Torso Twists)",
    sport: "Warm-up",
    badge: "🔥 Dynamic Warm-up",
    icon: "🌪️",
    description: "ยืนแยกเท้า ยกแขนระดับอก บิดลำตัวและไหล่ไปซ้าย-ขวาสลับกัน วอร์มกล้ามเนื้อเอวและกระดูกสันหลัง",
    instructions: [
      "1. ยืนกางเท้ากว้างเท่าหัวไหล่ ยกแขนงอศอกขึ้นระดับอก",
      "2. บิดเอวและลำตัวไปทางขวา",
      "3. บิดสลับกลับมาทางซ้ายอย่างนุ่มนวล"
    ],
    targetReps: 10,
    timeLimit: 35,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: false,
    rules: {
      repetition: {
        type: "arm_swing",
        cueBack: "บิดตัวไปด้านซ้าย!",
        cueForward: "บิดตัวไปด้านขวา!"
      }
    }
  },
  {
    id: "dynamic_side_lunges",
    name: "สไลด์ย่อข้างวอร์มสะโพก (Side Lunges)",
    sport: "Warm-up",
    badge: "🔥 Dynamic Warm-up",
    icon: "↔️",
    description: "ยืนก้าวเท้าออกด้านข้าง ย่อเข่าข้างหนึ่งสลับไปมา ซ้าย-ขวา เพิ่มความยืดหยุ่นก่อนพุ่งรับบอล",
    instructions: [
      "1. ยืนตรง เท้าชิด",
      "2. ก้าวขาขวาออกด้านข้าง ย่อสะโพกลง ขาซ้ายเหยียดตึง",
      "3. ดันตัวกลับขึ้นตรง แล้วก้าวทำสลับข้างซ้าย"
    ],
    targetReps: 8,
    timeLimit: 35,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "knee_bend",
        downAngle: 130,
        upAngle: 155,
        cueDown: "ย่อเข่าข้างหนึ่ง!",
        cueUp: "ดันตัวยืนตรง!"
      }
    }
  },
  {
    id: "dynamic_leg_swings",
    name: "แกว่งขาไปหน้า-หลัง (Leg Swings)",
    sport: "Warm-up",
    badge: "🔥 Dynamic Warm-up",
    icon: "🦵",
    description: "ยืนทรงตัว แกว่งขาไปด้านหน้าและหลังอย่างนุ่มนวล วอร์มข้อต่อสะโพกและเอ็นร้อยหวาย",
    instructions: [
      "1. ยืนตรง ทรงตัวด้วยขาซ้าย",
      "2. แกว่งขาขวาไปข้างหน้าและข้างหลังอย่างผ่อนคลาย",
      "3. ทำครบ 4 ครั้งแล้วสลับทำขาซ้าย"
    ],
    targetReps: 8,
    timeLimit: 35,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "high_knees",
        cueUp: "แกว่งขาขึ้นสูง!",
        cueDown: "สวิงขากลับหลัง!"
      }
    }
  },
  {
    id: "dynamic_overhead_reach",
    name: "เหยียดแขนแตะฟ้าสปริงตัว (Overhead Sky Reach)",
    sport: "Warm-up",
    badge: "🔥 Dynamic Warm-up",
    icon: "🙆",
    description: "ย่อเข่าเล็กน้อย สปริงตัวชูแขนทั้งสองข้างขึ้นฟ้าแล้วลดมือลง วอร์มกล้ามเนื้อสะบักและหัวไหล่",
    instructions: [
      "1. ยืนตรง ย่อเข่าลงเล็กน้อย มืออยู่ที่อก",
      "2. สปริงตัวยืดขาตรง พร้อมชูแขนทั้งสองข้างขึ้นแตะฟ้า",
      "3. ลดแขนลงย่อเข่ากลับสู่ท่าเตรียมเพื่อนับ 1 ครั้ง"
    ],
    targetReps: 8,
    timeLimit: 35,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "overhead_reach",
        cueUp: "เหยียดแขนแตะฟ้า!",
        cueDown: "ลดมือลงระดับอก!"
      }
    }
  },
  {
    id: "dynamic_ankle_hops",
    name: "กระโดดสปริงข้อเท้าเบาๆ (Ankle Hops)",
    sport: "Warm-up",
    badge: "🔥 Dynamic Warm-up",
    icon: "🦘",
    description: "กระโดดเด้งเบาๆ ด้วยปลายเท้า ช่วยกระตุ้นข้อเท้าและเอ็นร้อยหวายให้พร้อมตบและเซ็ตลูก",
    instructions: [
      "1. ยืนตรง เท้าชิดกัน มือเท้าเอว",
      "2. ใช้ปลายเท้าสปริงตัวกระโดดขึ้นลงเบาๆ ติดต่อกัน",
      "3. ไม่ต้องกระโดดสูง เน้นจังหวะสปริงตัวที่นุ่มนวล"
    ],
    targetReps: 10,
    timeLimit: 35,
    pointsPerRep: 1,
    fixedXP: 5,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "knee_bend",
        downAngle: 145,
        upAngle: 165,
        cueDown: "ย่อสปริงข้อเท้า!",
        cueUp: "เด้งตัวขึ้นเบาๆ!"
      }
    }
  }
];

// Combine into master list
SPORTS_CONFIG.push(...STRETCHING_EXERCISES, ...DYNAMIC_WARMUP_EXERCISES);

export const WARMUP_PRESETS = [
  {
    presetId: "high_knees",
    name: "ยกเข่าสูง (High Knees)",
    sport: "Warm-up",
    badge: "🏃 วอร์มยกเข่า",
    icon: "🏃",
    description: "วิ่งย่ำเท้ายกเข่าขึ้นสูงระดับสะโพก อุ่นเครื่องต้นขาและกล้ามเนื้อแกนกลาง",
    instructions: [
      "1. ยืนหันหน้าหากล้อง ให้เห็นลำตัวตั้งแต่ศีรษะถึงขา",
      "2. สลับยกเข่าซ้าย-ขวาขึ้นสูงระดับสะโพก/เอว",
      "3. แกว่งแขนสลับจังหวะอย่างกระฉับกระเฉง"
    ],
    targetReps: 10,
    timeLimit: 40,
    pointsPerRep: 15,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "high_knees",
        cueUp: "ยกเข่าสูงขึ้น!",
        cueDown: "สลับขา!"
      }
    }
  },
  {
    presetId: "sky_stretch",
    name: "ยืดแขนแตะฟ้า (Sky Stretch)",
    sport: "Warm-up",
    badge: "🙌 ยืดเหยียด",
    icon: "🙌",
    description: "ยืนตรง ยืดลำตัวและเอื้อมมือทั้งสองข้างขึ้นฟ้า คลายกล้ามเนื้อหลังและไหล่",
    instructions: [
      "1. ยืนตรง เท้าชิดหรือกางเท่าช่วงไหล่",
      "2. ชูมือทั้งสองข้างขึ้นเหนือศีรษะให้สุดแขน",
      "3. ดึงแขนกลับมาระดับอกเพื่อนับ 1 ครั้ง"
    ],
    targetReps: 8,
    timeLimit: 35,
    pointsPerRep: 15,
    requiresFullBody: false,
    rules: {
      repetition: {
        type: "overhead_reach",
        cueUp: "ยืดแขนขึ้นสุดฟ้า!",
        cueDown: "ลดแขนลงช้าๆ"
      }
    }
  },
  {
    presetId: "arm_swing",
    name: "แกว่งแขนหมุนไหล่ (Arm Swings)",
    sport: "Warm-up",
    badge: "⚡ วอร์มหัวไหล่",
    icon: "⚡",
    description: "แกว่งแขนขึ้นลงและหมุนหัวไหล่ วอร์มข้อต่อและเอ็นหัวไหล่ก่อนเล่นกีฬา",
    instructions: [
      "1. ยืนตรง ผ่อนคลายหัวไหล่",
      "2. แกว่งแขนไปข้างหน้าและยกขึ้นระดับไหล่/ศีรษะ",
      "3. ทิ้งแขนลงแกว่งไปข้างหลังเพื่อนับ 1 ครั้ง"
    ],
    targetReps: 10,
    timeLimit: 35,
    pointsPerRep: 10,
    requiresFullBody: false,
    rules: {
      repetition: {
        type: "arm_swing",
        cueSwing: "แกว่งแขนเป็นจังหวะ!",
        cueReset: "ผ่อนคลายไหล่"
      }
    }
  },
  {
    presetId: "easy_squat",
    name: "สควอท ย่อเข่าเบาๆ (Easy Squats)",
    sport: "Warm-up",
    badge: "🦵 วอร์มขา",
    icon: "🦵",
    description: "ย่อเข่าระดับตื้นๆ สำหรับเด็กประถม กระตุ้นข้อต่อสะโพกและต้นขา",
    instructions: [
      "1. ยืนกางขาเท่าช่วงไหล่",
      "2. ย่อเข่าลงเล็กน้อยคล้ายนั่งเก้าอี้",
      "3. ยืดตัวขึ้นตรงเพื่อนับ 1 ครั้ง"
    ],
    targetReps: 8,
    timeLimit: 40,
    pointsPerRep: 15,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "knee_bend",
        downAngle: 128,
        upAngle: 155,
        cueDown: "ย่อเข่าลงนิดนึง!",
        cueUp: "ยืดตัวขึ้นตรง!"
      }
    }
  },
  {
    presetId: "jumping_jacks_gentle",
    name: "กระโดดตบจังหวะสบาย (Cardio Warm-up)",
    sport: "Cardio",
    badge: "⭐ คาร์ดิโอ",
    icon: "⭐",
    description: "กางแขนกางขาเป็นจังหวะสบายๆ ปลุกความกระปรี้กระเปร่า",
    instructions: [
      "1. ยืนตรงมือแนบลำตัว",
      "2. กางแขนกางขาออกเป็นรูปดาว",
      "3. กลับสู่ท่ายืนตรงเพื่อนับ 1 ครั้ง"
    ],
    targetReps: 10,
    timeLimit: 35,
    pointsPerRep: 15,
    requiresFullBody: true,
    rules: {
      repetition: {
        type: "jumping_jack",
        armSpreadAngle: 125,
        cueUp: "กางแขนออก!",
        cueDown: "หุบแขนแนบลำตัว!"
      }
    }
  }
];

export function getExerciseById(id) {
  const all = getAllExercises();
  return all.find(item => item.id === id) || all[0];
}

export function getAllExercises() {
  let customList = [];
  try {
    const raw = localStorage.getItem("custom_sports_config");
    if (raw) {
      customList = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error reading custom config:", e);
  }

  // Create a map from built-in SPORTS_CONFIG
  const map = new Map();
  SPORTS_CONFIG.forEach(ex => map.set(ex.id, { ...ex, isBuiltin: true }));

  // Override or add custom exercises
  customList.forEach(ex => {
    map.set(ex.id, { ...ex, isCustom: !ex.isBuiltin });
  });

  return Array.from(map.values());
}

export async function saveCustomExercises(customList) {
  try {
    localStorage.setItem("custom_sports_config", JSON.stringify(customList));
    // Also sync to server so all mobile devices & classroom tablets receive it
    await fetch("/api/custom-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customList)
    });
  } catch (err) {
    console.warn("Could not sync custom exercises to server:", err);
  }
}

export async function syncExercisesFromServer() {
  try {
    let res = await fetch("/api/custom-exercises").catch(() => null);
    if (!res || !res.ok) {
      // Fallback for static hosting like GitHub Pages
      res = await fetch("custom_exercises.json").catch(() => null);
    }
    if (res && res.ok) {
      const serverList = await res.json();
      if (Array.isArray(serverList) && serverList.length > 0) {
        localStorage.setItem("custom_sports_config", JSON.stringify(serverList));
        return getAllExercises();
      }
    }
  } catch (err) {
    // Offline fallback
  }
  return getAllExercises();
}

export async function deleteCustomExercise(id) {
  const allCustom = JSON.parse(localStorage.getItem("custom_sports_config") || "[]");
  const filtered = allCustom.filter(ex => ex.id !== id);
  await saveCustomExercises(filtered);
}

export async function updateExerciseTargets(id, { targetReps, timeLimit, pointsPerRep }) {
  const all = getAllExercises();
  const target = all.find(ex => ex.id === id);
  if (!target) return;

  target.targetReps = targetReps !== undefined ? parseInt(targetReps, 10) : target.targetReps;
  target.timeLimit = timeLimit !== undefined ? parseInt(timeLimit, 10) : target.timeLimit;
  if (pointsPerRep !== undefined) target.pointsPerRep = parseInt(pointsPerRep, 10);

  const allCustom = JSON.parse(localStorage.getItem("custom_sports_config") || "[]");
  const existingIdx = allCustom.findIndex(ex => ex.id === id);
  if (existingIdx >= 0) {
    allCustom[existingIdx] = target;
  } else {
    allCustom.push(target);
  }
  await saveCustomExercises(allCustom);
}

export async function resetExercisesToDefault() {
  localStorage.removeItem("custom_sports_config");
  try {
    await fetch("/api/custom-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([])
    });
  } catch (err) {}
}
