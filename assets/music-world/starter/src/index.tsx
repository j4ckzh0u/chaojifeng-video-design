import React from 'react';
import {registerRoot, Composition, AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';
import job from '../public/job.json';
import {worldAt,seed} from '../core/state.mjs';

// Adapt these objects to the actual theme; retain the common clock and state.
const World: React.FC<{s:any}> = ({s}) => {
  const style=job.config.style;
  const ink=style==='ink', rain=style==='rain';
  return <>
    <color attach="background" args={[ink?'#e5dfcd':rain?'#122833':'#040a22']} />
    <fog attach="fog" args={[ink?'#e5dfcd':rain?'#668b94':'#040a22',12,38]} />
    <ambientLight intensity={.8}/><directionalLight position={[6,10,4]} intensity={2.8}/>
    <pointLight position={[-5,4,-2]} color={ink?'#d4b67c':'#55b8e4'} intensity={35}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.55,0]}><planeGeometry args={[70,70]}/><meshStandardMaterial color={ink?'#d7d3c1':rain?'#284d59':'#0d1a36'} roughness={rain?.18:.7} metalness={rain?.5:.15}/></mesh>
    {s.subjects.map((p:any,i:number)=><group key={p.id} position={[p.x,0,p.z]}>
      {ink?<mesh position={[0,p.height/2-.5,0]} scale={[1,p.height,1]}><coneGeometry args={[1.2,1,6]}/><meshStandardMaterial color={i%2?'#424e4d':'#202e31'} roughness={.95}/></mesh>:
       rain?<group rotation={[0,p.rot,0]}><mesh position={[0,p.height/2,0]} scale={[.7,p.height*.65,.7]}><sphereGeometry args={[.9,32,20]}/><meshPhysicalMaterial color="#c8e3e8" roughness={.2} metalness={.12} clearcoat={1}/></mesh><mesh position={[0,p.height*.4,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.68,.035,8,48]}/><meshStandardMaterial color="#397ad2"/></mesh></group>:
       <group rotation={[p.rot,p.rot*.7,0]}><mesh position={[0,p.height/2,0]}><torusGeometry args={[.6,.055,10,64]}/><meshStandardMaterial color={i%2?'#5ce0e5':'#f4c66a'} emissive={i%2?'#207f9d':'#ad7028'} emissiveIntensity={p.glow} metalness={.6} roughness={.23}/></mesh></group>}
    </group>)}
    {rain?Array.from({length:80},(_,i)=><mesh key={i} position={[(seed(i)-.5)*25,((seed(i+90)*10-s.t*3)%10+10)%10,(seed(i+180)-.5)*20]} rotation={[0,0,-.1]}><cylinderGeometry args={[.008,.008,.3,3]}/><meshBasicMaterial color="#c5e0e9" transparent opacity={.4}/></mesh>):null}
    {!ink&&!rain?<gridHelper args={[60,40,'#245e88','#142b4b']} position={[0,-.5,0]}/>:null}
  </>;
};

const Film:React.FC=()=>{
  const frame=useCurrentFrame(),s=worldAt(frame,job),c=job.config;
  return <AbsoluteFill style={{background:c.style==='ink'?'#e5dfcd':'#040a22'}}>
    {c.engine==='blender'?<AbsoluteFill><img src={staticFile(`frames/${String(frame).padStart(5,'0')}.png`)} style={{width:'100%',height:'100%'}}/></AbsoluteFill>:
      <ThreeCanvas width={c.width} height={c.height} camera={{position:s.camera as any,fov:42}} gl={{toneMapping:THREE.ACESFilmicToneMapping}}><World s={s}/></ThreeCanvas>}
    <AbsoluteFill style={{justifyContent:'flex-end',alignItems:'center',paddingBottom:c.height*.08,fontFamily:'sans-serif',fontSize:c.height*.034,color:c.style==='ink'?'#142326':'#edf2ee'}}>
      <div style={{background:c.style==='ink'?'#f2ebd9d0':'#04101bd0',padding:'8px 18px',borderRadius:6}}>{c.theme}</div>
    </AbsoluteFill>
    <AbsoluteFill style={{background:'#000',opacity:1-s.fade}}/>
    <Audio src={staticFile('music.wav')} volume={Math.min(1,s.t/.04)*Math.min(1,(c.duration-s.t)/.6)}/>
  </AbsoluteFill>;
};
registerRoot(()=> <Composition id="MusicWorld" component={Film} durationInFrames={Math.round(job.config.duration*job.config.fps)} fps={job.config.fps} width={job.config.width} height={job.config.height}/>);
