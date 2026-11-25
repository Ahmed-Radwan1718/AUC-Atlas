import * as THREE from "three";

// Local, un-surveyed scene coordinates in meters. Only plaza length is sourced.
// Relative building arrangement follows AUC's original illustrated campus plan.
export const landmarks: { name: string; position: [number, number, number] }[] = [
  { name: "AUC Library", position: [-52, 26, -12] },
  { name: "Bartlett Plaza", position: [0, 2, 5] },
  { name: "Sciences & Engineering", position: [54, 26, 20] },
  { name: "Campus Center", position: [-14, 22, -89] },
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
  box(208,2,214,0,-3,0,ground);
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
  building(-18,-91,45,24,15,1);
  building(-53,68,37,24,13,1);
  box(20,5,11,-20,2.5,-81,stone);
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
  for(const z of [-30,28]){
    box(10,.22,10,0,.12,z,band);
    cylinder(2.35,2.35,.45,0,.45,z,stone,32);
    cylinder(1.95,1.95,.08,0,.72,z,water,32);
    cylinder(.37,.5,.55,0,.94,z,light);
  }
  for(const x of [-91,91]){
    box(14,.15,193,x,-.8,0,green);
    for(let z=-88;z<95;z+=13){
      cylinder(.24,.35,3.5,x,1,z,trunk);
      const t=new THREE.Mesh(new THREE.IcosahedronGeometry(2.8,1),leaf2);t.position.set(x,3.6,z);t.scale.y=1.1;t.castShadow=true;root.add(t);
    }
  }
  return root;
}
