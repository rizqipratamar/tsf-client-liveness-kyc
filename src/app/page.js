"use client";
import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import * as facemesh from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";
import * as drawingUtils from "@mediapipe/drawing_utils";
import { useRouter } from "next/router";

const instructions = [
  { text: "Buka Mulut Anda", type: "mouth", duration: 2 }, // Duration set to 2 seconds
  { text: "Kedipkan Mata Anda", type: "blink", count: 0 },
];

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [landmarks, setLandmarks] = useState(null);
  const [instructionList, setInstructionList] = useState([]);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [actionCounts, setActionCounts] = useState({ mouth: 0, blink: 0 });
  const [mouthOpenStartTime, setMouthOpenStartTime] = useState(null);

  // Thresholds
  const EAR_THRESHOLD = 0.125;
  const MAR_THRESHOLD = 0.35;

  useEffect(() => {
    generateRandomInstructions();
  }, []);

  useEffect(() => {
    const faceMesh = new facemesh.FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      setLandmarks(results.multiFaceLandmarks && results.multiFaceLandmarks[0]);
      setIsLoading(false);
      setModelLoaded(true);
    });

    if (
      typeof navigator.mediaDevices !== "undefined" &&
      navigator.mediaDevices.getUserMedia
    ) {
      const camera = new cam.Camera(videoRef.current, {
        onFrame: async () => {
          await faceMesh.send({ image: videoRef.current });
        },
        width: 500,
        height: 500,
      });
      camera.start();
    }

    return () => {
      faceMesh.close();
    };
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

  useEffect(() => {
    if (landmarks) {
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d");

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(
        videoRef.current,
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );

      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        facemesh.FACEMESH_TESSELATION,
        { color: "#C0C0C070", lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        facemesh.FACEMESH_RIGHT_EYE,
        { color: "#FF3030", lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        facemesh.FACEMESH_RIGHT_EYEBROW,
        { color: "#FF3030", lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        facemesh.FACEMESH_LEFT_EYE,
        { color: "#30FF30", lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        facemesh.FACEMESH_LEFT_EYEBROW,
        { color: "#30FF30", lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        facemesh.FACEMESH_FACE_OVAL,
        { color: "#E0E0E0", lineWidth: 1 }
      );
      drawingUtils.drawConnectors(
        canvasCtx,
        landmarks,
        facemesh.FACEMESH_LIPS,
        { color: "#E0E0E0", lineWidth: 1 }
      );

      canvasCtx.restore();
    }
  }, [landmarks]);

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

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <div className="w-screen h-dvh flex items-center justify-center relative">
      <Head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />

        <meta name="screen-orientation" content="portrait" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
        <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />

        <title>Verifikasi Liveness</title>
      </Head>
      <main className="">
        {isLoading && (
          <span className="loading loading-bars loading-lg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></span>
        )}

        {!modelLoaded && (
          <div
            role="alert"
            className="absolute flex justify-center text-center top-4 z-50 w-[380px] left-1/2 -translate-x-1/2 alert alert-info"
          >
            <span className="text-center">Model sedang dimuat...</span>
          </div>
        )}

        {modelLoaded && showAlert && (
          <div
            role="alert"
            className="absolute animate-pulse flex justify-center text-center top-4 z-50 w-[380px] left-1/2 -translate-x-1/2 alert alert-warning"
          >
            <span className="text-center">
              {instructionList[currentInstructionIndex].text}
              {instructionList[currentInstructionIndex].type === "blink" &&
                ` (${actionCounts.blink}/${instructionList[currentInstructionIndex].count} kali)`}
            </span>
          </div>
        )}

        {isVerified && (
          <div
            role="alert"
            className="absolute flex animate-pulse  justify-center text-center top-4 z-50 w-[380px] left-1/2 -translate-x-1/2 alert alert-success"
          >
            <span>Verifikasi Berhasil!</span>
            <button className="btn btn-sm btn-gray ml-2" onClick={handleReset}>
              Reset
            </button>
          </div>
        )}

        <div class="w-[400px] h-[576px]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            width={400}
            height={576}
            className="invisible"
          />
          <canvas
            ref={canvasRef}
            width={400}
            height={576}
            class="absolute top-0 z-10"
          />
        </div>
      </main>
    </div>
  );
}
