"use client";
import React from "react";
import { useState, useEffect } from "react";
import { motion, useTime, useTransform, useSpring, MotionValue } from "framer-motion";
import { time } from "console";

//初期設定(初期条件)
const SPHERE_RADIUS = 90; // Recording Circle（球体半径）
const PARTICLE_SIZE = 4; 
const PARTICLE_GAP = 5; // 粒子の密度
const ROTATION_SPEED = 0.0005; //回転速度 

interface ParticleData{
    id: number;
    textX: number;
    textY: number;
    sphereX: number;
    sphereY: number;
    sphereZ: number; 
}

export function RecordingWithIris(){
    const [isRecording, setIsRecording] = useState<any>(false);
    const [particles, setParticles] = useState<ParticleData[]>([]);

    const time = useTime();

}
const RotatingParticleOnRecording = ({
    data,
    time, 
    mode
}: {
    data: ParticleData;
    time: MotionValue<number>;
    mode: MotionValue<number>;
}) => {
    const rotateX = useTransform(time, (t) => {
        const angle = t * 
    })
}