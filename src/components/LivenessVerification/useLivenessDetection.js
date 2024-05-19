"use client";
import { useEffect, useRef, useState } from "react";
import * as facemesh from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";

const useLivenessDetection = () => {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [landmarks, setLandmarks] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      setIsVideoReady(true);
    }
  }, [videoRef]);

  useEffect(() => {
    if (videoRef.current && isVideoReady) {
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
        setLandmarks(
          results.multiFaceLandmarks && results.multiFaceLandmarks[0]
        );
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
          width: 640,
          height: 480,
        });
        camera.start();
      }

      return () => {
        faceMesh.close();
      };
    }
  }, [videoRef, isVideoReady]);

  return { videoRef, isLoading, modelLoaded, landmarks };
};

export default useLivenessDetection;
