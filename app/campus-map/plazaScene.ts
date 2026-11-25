import * as THREE from "three";

// Local, un-surveyed scene coordinates in meters. Only plaza length is sourced.
// Relative building arrangement follows AUC's original illustrated campus plan.
export const landmarks: { name: string; position: [number, number, number] }[] = [
  { name: "AUC Library", position: [-52, 26, -12] },
  { name: "Bartlett Plaza", position: [0, 2, 5] },
  { name: "Sciences & Engineering", position: [54, 26, 20] },
  { name: "Jameel Hall", position: [48, 24, -76] },
  { name: "Core Academic Center", position: [-40, 20, 70] },
];
export function buildPlaza() {
  const root = new THREE.Group();
  const mat = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: .88 });
  const stone = mat("#d9c3a0"), light = mat("#e9d8b9"), stripe = mat("#b5a18b"), roof = mat("#e5d9c5"), glass = mat("#626e70"), ground = mat("#d9cfba"), paving = mat("#e8dfce"), band = mat("#c9bfad"), green = mat("#a8b28a"), leaf = mat("#6f8853"), leaf2 = mat("#91a56b"), trunk = mat("#a58966"), water = mat("#87b9b7"), bench = mat("#937f63");
  const box = (w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material) => {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true; root.add(o); return o;
  };
  const cylinder = (r1:number,r2:number,h:number,x:number,y:number,z:number,m:THREE.Material,n=10) => {
    const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,n),m); o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true; root.add(o); return o;
  };
  box(208,2,214,0,-1.02,0,ground);
  box(48,.4,150,0,-.2,0,paving);
  // Broad bands of stone, not a surveyed paving layout.
  for(let z=-70;z<=70;z+=10) box(48,.035,.22,0,.025,z,band);
  for(const x of [-18,-9,9,18]) box(.22,.04,150,x,.025,0,band);
  box(10,.08,150,0,.03,0,light);
  for(const side of [-1,1]) {
    box(8,1.2,150,side*28,.2,0,stone);
    for(let i=0;i<3;i++) box(1.3,.3*(i+1),150,side*(24+i*1.3),.15*(i+1)-.02,0,light);
  }
  function building(x:number,z:number,w:number,d:number,h:number, face: -1|1, floors=3, grid=false) {
    box(w,.54,d,x,.23,z,stone);
    box(w,h,d,x,h/2+.5,z,stone);
    box(w+.45,.7,d+.45,x,h+.85,z,roof);
    box(w-4,1.1,d-4,x,h+1.35,z,light);
    const front=x+face*(w/2+.05);
    for(let f=0;f<floors;f++){
      const y=3.1+f*(h-4)/floors;
      box(.14,.42,d,front,y-1.6,z,stripe);
      for(let k=-d/2+3;k<d/2-2;k+=grid?3:5.2){
        box(.18,grid?1.95:2.4,grid?1.9:1.8,front,y,z+k,glass);
        box(.22,.25,grid?2.25:2.25,front+face*.08,y-1.2,z+k,light);
      }
    }
    for(const end of [-1,1]) for(let f=0;f<floors;f++) for(let k=-w/2+3;k<w/2-2;k+=5) box(1.7,2.2,.18,x+k,3.4+f*(h-4)/floors,z+end*(d/2+.05),glass);
    box(w*.22,2.2,d*.25,x,h+2.4,z,stripe);
  }
  // Library: striped mass and recognizable deep square-grid screen facing plaza.
  building(-54,-10,39,72,19,1,4,true);
  box(4,18,46,-32.5,9.5,-9,glass);
  for(let z=-32;z<=14;z+=3.3) box(.95,18.5,.68,-30.2,9.7,z,light);
  for(let y=1.5;y<=19;y+=2.7) box(1.0,.64,47,-30.2,y,-9,light);
  for(let y=2;y<19;y+=3.4) box(.25,.55,70,-34.2,y,-10,stripe);
  // Simplified courtyard-like SSE blocks and academic masses.
  building(47,22,27,82,15,-1);
  building(76,22,19,82,18,-1);
  building(62,58,39,13,16,-1);
  building(62,-15,39,13,17,-1);
  box(16,.12,55,62,.05,22,green);
  building(51,-69,37,29,18,-1,4);
  building(79,-66,15,34,15,-1);
  building(-53,68,37,24,13,1);
  // Shade structures at the library edge.
  for(const z of [-28,23]) {
    for(const x of [-27,-21]) for(const dz of [-6,6]) box(.5,3.6,.5,x,2.2,z+dz,bench);
    for(let k=-6;k<=6;k+=1) box(7,.35,.4,-24,4.1,z+k,bench);
  }
  function palm(x:number,z:number) {
    cylinder(.28,.46,6,x,3.8,z,trunk);
    const crown=new THREE.Vector3(x,6.8,z);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;
      const o=new THREE.Mesh(new THREE.SphereGeometry(1,8,5),i%2?leaf:leaf2);
      o.scale.set(2.9,.32,.64);
      o.rotation.y=-a; o.rotation.z=-.13;
      o.position.copy(crown).add(new THREE.Vector3(Math.cos(a)*1.8,-.35,Math.sin(a)*1.8));
      o.castShadow=true; root.add(o);
    }
  }
  for(const z of [-58,-39,-16,9,34,58]){
    for(const side of [-1,1]){
      const x=side*21;
      box(4.5,.55,4.5,x,.28,z,stone);
      box(3.8,.08,3.8,x,.6,z,green); palm(x,z);
      box(3,.45,.85,x-side*3,.65,z+3.4,bench);
    }
  }
  // Recirculating water, confined to the existing fountain basins.
  const waterAnimations: ((seconds: number) => void)[] = [];
  const streamMaterial = new THREE.MeshStandardMaterial({
    color: "#91c9d1", roughness: .22, metalness: .08,
    transparent: true, opacity: .84, depthWrite: false,
  });
  const dropMaterial = new THREE.MeshStandardMaterial({
    color: "#d9f6f8", roughness: .15, emissive: "#397b88", emissiveIntensity: .24,
  });
  const dropGeometry = new THREE.SphereGeometry(1, 8, 6);
  const rippleGeometry = new THREE.RingGeometry(.94, 1, 48);
  const jetCount = 8, dropsPerJet = 12;
  const dropTransform = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3();
  for(const z of [-30,28]){
    box(10,.22,10,0,.12,z,band);
    cylinder(2.35,2.35,.45,0,.45,z,stone,32);
    cylinder(1.95,1.95,.08,0,.72,z,water,32);
    cylinder(.37,.5,.55,0,.94,z,light);
    const fountain = new THREE.Group();
    fountain.position.z = z;
    root.add(fountain);
    // Parabolic streams run from the central spout to the water surface.
    const path = (angle: number, t: number) => {
      const radius = .13 + 1.52 * t;
      return new THREE.Vector3(
        Math.cos(angle) * radius,
        1.22 - .45 * t + 4.8 * t * (1 - t),
        Math.sin(angle) * radius
      );
    };
    for(let j=0;j<jetCount;j++){
      const angle=j*Math.PI*2/jetCount;
      const points=Array.from({length:25},(_,i)=>path(angle,i/24));
      const curve=new THREE.CatmullRomCurve3(points);
      fountain.add(new THREE.Mesh(new THREE.TubeGeometry(curve,24,.045,6,false),streamMaterial));
    }
    const drops=new THREE.InstancedMesh(dropGeometry,dropMaterial,jetCount*dropsPerJet);
    drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    drops.frustumCulled=false;
    fountain.add(drops);
    const ripples=Array.from({length:3},()=>{
      const material=new THREE.MeshBasicMaterial({
        color:"#e4f8f5",transparent:true,opacity:.4,depthWrite:false,side:THREE.DoubleSide,
      });
      const ripple=new THREE.Mesh(rippleGeometry,material);
      ripple.rotation.x=-Math.PI/2;
      ripple.position.y=.77;
      fountain.add(ripple);
      return ripple;
    });
    waterAnimations.push(seconds=>{
      for(let j=0;j<jetCount;j++){
        const angle=j*Math.PI*2/jetCount;
        for(let i=0;i<dropsPerJet;i++){
          const t=(seconds*.85+i/dropsPerJet+j*.027+z*.012+1)%1;
          const radius=.13+1.52*t;
          dropTransform.position.set(Math.cos(angle)*radius,1.22-.45*t+4.8*t*(1-t),Math.sin(angle)*radius);
          tangent.set(Math.cos(angle)*1.52,-.45+4.8*(1-2*t),Math.sin(angle)*1.52).normalize();
          dropTransform.quaternion.setFromUnitVectors(up,tangent);
          dropTransform.scale.set(.055,.15,.055);
          dropTransform.updateMatrix();
          drops.setMatrixAt(j*dropsPerJet+i,dropTransform.matrix);
        }
      }
      drops.instanceMatrix.needsUpdate=true;
      ripples.forEach((ripple,i)=>{
        const phase=(seconds*.65+i/3)%1;
        ripple.scale.setScalar(.3+1.58*phase);
        ripple.material.opacity=.48*Math.sin(Math.PI*phase);
      });
    });
  }
  for(const x of [-91,91]){
    box(14,.15,193,x,.05,0,green);
    for(let z=-88;z<95;z+=13){
      cylinder(.24,.35,3.5,x,1,z,trunk);
      const t=new THREE.Mesh(new THREE.IcosahedronGeometry(2.8,1),leaf2);t.position.set(x,3.6,z);t.scale.y=1.1;t.castShadow=true;root.add(t);
    }
  }
  const animateWater = (seconds: number) => waterAnimations.forEach(update => update(seconds));
  animateWater(0);
  return { root, animateWater };
}
