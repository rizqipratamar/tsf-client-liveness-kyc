"use client";
import { useEffect, useState } from "react";

const useInstructions = (landmarks) => {
  const instructions = [
    { text: "Buka Mulut Anda", type: "mouth", duration: 2 },
    { text: "Kedipkan Mata Anda", type: "blink", count: 0 },
  ];

  const [instructionList, setInstructionList] = useState([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [actionCounts, setActionCounts] = useState({ mouth: 0, blink: 0 });
  const [mouthOpenStartTime, setMouthOpenStartTime] = useState(null);

  // Thresholds
  const EAR_THRESHOLD = 0.25;
  const MAR_THRESHOLD = 0.5;

  useEffect(() => {
    generateRandomInstructions();
  }, []);

  useEffect(() => {
    if (landmarks && instructionList.length > 0) {
      const EAR = calculateEAR(landmarks);
      const MAR = calculateMAR(landmarks);

      const currentInstruction = instructionList[currentInstructionIndex];
      let newActionCounts = { ...actionCounts };

      switch (currentInstruction.type) {
        case "mouth":
          const isMouthOpen = MAR > MAR_THRESHOLD;
          if (isMouthOpen) {
            if (mouthOpenStartTime === null) {
              setMouthOpenStartTime(Date.now());
            }

            const elapsedTime = (Date.now() - mouthOpenStartTime) / 1000;

            if (elapsedTime >= currentInstruction.duration) {
              nextInstruction();
              setMouthOpenStartTime(null);
            }
          } else {
            setMouthOpenStartTime(null); // Reset if mouth is closed
          }
          break;
        case "blink":
          const isBlinking = EAR < EAR_THRESHOLD;
          if (isBlinking) {
            setTimeout(() => {
              if (isBlinking) {
                newActionCounts.blink += 1;
                setActionCounts(newActionCounts);

                if (newActionCounts.blink === currentInstruction.count) {
                  nextInstruction();
                }
              }
            }, 500);
          }
          break;
        default:
          break;
      }
    }
  }, [
    landmarks,
    instructionList,
    currentInstructionIndex,
    actionCounts,
    mouthOpenStartTime,
  ]);

  const generateRandomInstructions = () => {
    const shuffledInstructions = shuffle(instructions);
    const newInstructionList = shuffledInstructions.map((instruction) => {
      if (instruction.type === "blink") {
        return {
          ...instruction,
          count: getRandomInt(2, 5),
        };
      } else {
        return instruction;
      }
    });

    setInstructionList(newInstructionList);
    setCurrentInstructionIndex(0);
    setActionCounts({ mouth: 0, blink: 0 });
    setShowAlert(true);
    setMouthOpenStartTime(null);
  };

  const nextInstruction = () => {
    if (currentInstructionIndex < instructionList.length - 1) {
      setCurrentInstructionIndex(currentInstructionIndex + 1);
      setActionCounts({ mouth: 0, blink: 0 });
      setShowAlert(true);
      setMouthOpenStartTime(null);
    } else {
      setIsVerified(true);
      setShowAlert(false);
    }
  };

  function calculateEAR(landmarks) {
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];

    const leftEAR =
      distance(leftEyeTop, leftEyeBottom) /
      distance(landmarks[33], landmarks[133]);
    const rightEAR =
      distance(rightEyeTop, rightEyeBottom) /
      distance(landmarks[362], landmarks[263]);

    return (leftEAR + rightEAR) / 2;
  }

  function calculateMAR(landmarks) {
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];

    return (
      distance(upperLip, lowerLip) / distance(landmarks[33], landmarks[263])
    );
  }

  function distance(point1, point2) {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
    );
  }

  function shuffle(array) {
    let currentIndex = array.length,
      randomIndex;

    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  }

  return {
    instructionList,
    currentInstructionIndex,
    showAlert,
    isVerified,
    generateRandomInstructions,
  };
};

export default useInstructions;
