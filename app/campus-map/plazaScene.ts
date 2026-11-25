import * as THREE from "three";

// Local, un-surveyed scene coordinates in meters. Only plaza length is sourced.
// Relative building arrangement follows AUC's original illustrated campus plan.
export const landmarks: { name: string; position: [number, number, number] }[] = [
  { name: "AUC Library", position: [-52, 26, -12] },
  { name: "Bartlett Plaza", position: [0, 2, 5] },
  { name: "Sciences & Engineering", position: [54, 26, 20] },
  { name: "Jameel Hall", position: [48, 24, -76] },
  { name: "Core Academic Center", position: [-40, 20, 70] },
  { name: "Moataz Al Alfi Hall", position: [14, 24, -198] },
  { name: "Bassily Auditorium", position: [55.8, 30, -198] },
  { name: "Cilantro", position: [-24, 18, -96] },
  { name: "Relish · Main Cafeteria", position: [-64, 12.5, -96] },
  { name: "University Residences", position: [-87, 13, -280] },
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
  box(304,2,470,-28,-1.02,-128,ground);
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
  // Legacy library remains as a fallback while the detailed GLB loads.
  const libraryStart = root.children.length;
  building(-54,-10,39,72,19,1,4,true);
  box(4,18,46,-32.5,9.5,-9,glass);
  for(let z=-32;z<=14;z+=3.3) box(.95,18.5,.68,-30.2,9.7,z,light);
  for(let y=1.5;y<=19;y+=2.7) box(1.0,.64,47,-30.2,y,-9,light);
  for(let y=2;y<19;y+=3.4) box(.25,.55,70,-34.2,y,-10,stripe);
  const libraryFallback = new THREE.Group();
  libraryFallback.name = "Library loading fallback";
  for (const part of root.children.slice(libraryStart)) libraryFallback.add(part);
  root.add(libraryFallback);
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
  // Campus Center extension registered approximately to the existing scene using
  // the library and Core Academic Center as reference points. OSM building ways
  // 502355931, 539061341, 1223433824 and 260329189 (© OpenStreetMap contributors,
  // https://www.openstreetmap.org/copyright) establish the relative locations.
  // Library-to-venue distances are ~200 m and ~220 m; venue centers ~67 m apart.
  // AUC NCmap.pdf and Legorreta describe the intervening Campus Center courts.
  // Existing plaza geometry is illustrative, so this is not a surveyed registration.
  // Unmodeled Campus Center areas remain open.
  const blue = mat("#335a9b"), blueEdge = mat("#28477b"), blueJoint = mat("#5278ac");
  const cyan = mat("#408d9c"), terracotta = mat("#ad583b"), recess = mat("#414343");
  const mosaicBlue = mat("#80a9bb"), mosaicDark = mat("#303c49"), mosaicRed = mat("#a96552");
  const mosaicLight = mat("#d8d3ba");
  // Narrow connecting walk beyond Bartlett Plaza, opening into a separate court.
  box(22,.38,98,0,-.19,-124,paving);
  for(let z=-170;z<=-80;z+=10) box(22,.035,.22,0,.025,z,band);
  box(53,.38,48,30,-.19,-171,paving);
  for(let z=-190;z<=-150;z+=10) box(53,.035,.22,30,.025,z,band);
  // Transform each venue as a unit so façade details remain aligned.
  function placeVenue(start:number,oldX:number,oldZ:number,newX:number,newZ:number,sx:number,sy:number,sz:number){
    const parts=root.children.slice(start);
    const group=new THREE.Group();
    for(const part of parts){part.position.x-=oldX;part.position.z-=oldZ;group.add(part);}
    group.position.set(newX,0,newZ);group.scale.set(sx,sy,sz);root.add(group);
  }

  // Moataz Al Alfi: limestone plinth, deep blue recessed entrance,
  // turquoise round columns and a tall split blue-tiled upper volume.
  const hallStart=root.children.length;
  const hallX=-47, hallZ=-148;
  box(42,9,32,hallX-2,4.5,hallZ,stone);
  box(5,9,5,-23.5,4.5,hallZ-17.5,stone);
  box(5,9,5,-23.5,4.5,hallZ+17.5,stone);
  box(5,2.1,40,-23.5,7.95,hallZ,stone);
  box(47,.45,40,-44.5,9.2,hallZ,roof);
  box(.18,6.3,27,-27.9,3.2,hallZ,blueEdge);
  for(const dz of [-9,9]){
    cylinder(.75,.75,6.8,-23.5,3.4,hallZ+dz,cyan,16);
    box(.22,3.5,5,-27.75,2.8,hallZ+dz*1.38,terracotta);
    box(.25,2.7,4.1,-27.58,2.8,hallZ+dz*1.38,glass);
  }
  // Mashrabiyya/window belt beneath the blue upper mass.
  box(31,3.3,30,-47,11,hallZ,blueEdge);
  for(let dz=-12;dz<=12;dz+=4.8){
    box(.3,2.6,3.9,-31.3,10.9,hallZ+dz,terracotta);
    for(let j=-1;j<=1;j++) box(.35,1.9,.64,-31.1,10.9,hallZ+dz+j*.9,glass);
  }
  // Two slightly offset planes make the characteristic vertical slit.
  box(30,15.5,14.4,-47,20.3,hallZ-7.8,blue);
  box(30,14.4,14.4,-47,19.75,hallZ+7.8,blue);
  for(const dz of [-7.8,7.8]){
    for(let y=13.1;y<26.8;y+=1.5) box(.06,.035,14.35,-31.97,y,hallZ+dz,blueJoint);
    for(let k=-6;k<=6;k+=1.5) box(.065,13.6,.035,-31.96,19.9,hallZ+dz+k,blueJoint);
  }
  box(1.3,.8,2.4,-31.4,20.3,hallZ,terracotta);
  box(2.2,.3,10,-47,28.2,hallZ-7.8,blueEdge);

  // Mapped hall footprint is approximately 21.5 by 23.5 m (OSM way 1223433824).
  placeVenue(hallStart,hallX,hallZ,14,-198,.46,.8,.5875);

  // Bassily Auditorium: a chamfered auditorium mass based on the published
  // seating plan, with a lower entry wing and a tall mosaic-faced stone tower.
  const auditoriumStart=root.children.length;
  const auditoriumX=47, auditoriumZ=-150;
  const outline=new THREE.Shape();
  const corners=[[-16,-25],[16,-25],[25,-16],[25,16],[16,25],[-16,25],[-25,16],[-25,-16]];
  corners.forEach(([x,z],i)=>i===0?outline.moveTo(x,z):outline.lineTo(x,z));
  outline.closePath();
  const auditorium=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:21,bevelEnabled:false}),stone);
  auditorium.rotation.x=-Math.PI/2;
  auditorium.position.set(auditoriumX,0,auditoriumZ);
  auditorium.castShadow=true;auditorium.receiveShadow=true;root.add(auditorium);
  const auditoriumRoof=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:.6,bevelEnabled:false}),roof);
  auditoriumRoof.rotation.x=-Math.PI/2;
  auditoriumRoof.position.set(auditoriumX,21,auditoriumZ);
  auditoriumRoof.castShadow=true;auditoriumRoof.receiveShadow=true;root.add(auditoriumRoof);
  // Open entrance bays between piers (dark interior at the rear).
  box(.2,6,34,21.8,3,auditoriumZ+4,recess);
  for(const dz of [-13,-2,9,21]) box(8,7,2.5,18,3.5,auditoriumZ+dz,stone);
  box(8,2.7,37,18,8.35,auditoriumZ+4,stone);
  box(8.4,.45,37.4,18,9.9,auditoriumZ+4,roof);
  // Tall tower and a simplified original geometric interpretation of the mosaic.
  const towerZ=auditoriumZ-19;
  box(12,29,17,18,14.5,towerZ,stone);
  box(12.4,.5,17.4,18,29.25,towerZ,roof);
  box(.12,23,11.4,11.93,14.6,towerZ,mosaicBlue);
  const ribbon=(pts:number[][],material:THREE.Material)=>{
    const s=new THREE.Shape();
    pts.forEach(([x,y],i)=>i===0?s.moveTo(x,y):s.lineTo(x,y));s.closePath();
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(s),material);
    mesh.rotation.y=-Math.PI/2;
    mesh.position.set(11.84,14.6,towerZ);
    root.add(mesh);
  };
  ribbon([[-2.7,-10],[-.9,-5],[-1.8,1],[-3.3,10],[-1.7,10],[.1,2],[.8,-5],[-.8,-10]],mosaicLight);
  ribbon([[.4,-10],[1.8,-6],[1.1,1],[-.2,10],[1.1,10],[2.9,1],[2.8,-6],[1.7,-10]],mosaicDark);
  ribbon([[-3.5,-10],[-2.1,-4],[-3.1,3],[-4.3,10],[-3.7,10],[-2.4,3],[-1.5,-4],[-2.9,-10]],mosaicRed);
  // A few small shadowed square openings on the tower's side.
  for(let y=8;y<=24;y+=3.5) for(const dx of [-3,0,3]) box(1.1,1.1,.16,18+dx,y,towerZ-8.55,recess);
  for(let y=3;y<29;y+=3) box(.08,.11,17,11.95,y,towerZ,stripe);

  placeVenue(auditoriumStart,auditoriumX,auditoriumZ,79,-179,.8,1,1);

  // Separate Campus Center court. The pergola links the hall toward the
  // everyday facilities; landscaping is indicative pending a detailed site plan.
  for(const z of [-165,-152,-139]){
    for(const x of [-9,2]) cylinder(.65,.75,5.2,x,2.6,z,terracotta,12);
    box(13,.65,1.1,-3.5,5.4,z,terracotta);
  }
  for(const x of [-9,-5.3,-1.7,2]) box(.8,.72,28,x,5.45,-152,terracotta);
  // Campus Center dining: AUC's dining directory locates both outlets here.
  // Cilantro and Relish share the Everyday Facilities building, per on-campus
  // layout correction. Arch and terrace massing follow reference photographs.
  // https://www.aucegypt.edu/student-life/dining
  // https://www.legorreta.mx/en/proyecto-universidad-americana-en-el-cairo-campus-center
  // Exact outlet boundaries, building footprints and heights are approximate.
  const diningStucco = mat("#bc7253"), diningTrim = mat("#9c6249"),
    diningShade = mat("#8d7861"), umbrellaFabric = mat("#eee5cf"),
    diningFrame = mat("#635c4e");
  const cafeX=-49, cafeZ=-96;
  // The library-side pedestrian court stays open; connect it to the existing spine.
  box(44,.12,25,-47,.06,-58.5,paving);
  box(13,.16,96,-17.5,.08,-124,paving);
  box(41,.16,21,-48,.08,-121.5,paving);

  // Everyday Facilities: sandstone portal with a true semicircular void.
  // Local arch horizontal coordinates become world z after a quarter-turn.
  const archSpan=38, archHeight=17.5, archRadius=9.5, spring=5.5;
  const archShape = new THREE.Shape();
  archShape.moveTo(-archSpan/2,0);
  archShape.lineTo(-archSpan/2,archHeight);
  archShape.lineTo(archSpan/2,archHeight);
  archShape.lineTo(archSpan/2,0);
  archShape.lineTo(archRadius,0);
  archShape.lineTo(archRadius,spring);
  for(let i=1;i<=48;i++){
    const a=Math.PI*i/48;
    archShape.lineTo(archRadius*Math.cos(a),spring+archRadius*Math.sin(a));
  }
  archShape.lineTo(-archRadius,0);
  archShape.closePath();
  const portal = new THREE.Mesh(
    new THREE.ExtrudeGeometry(archShape,{depth:2.2,bevelEnabled:false}),stone);
  portal.rotation.y=Math.PI/2;
  portal.position.set(-27,0,cafeZ);
  portal.castShadow=true;portal.receiveShadow=true;root.add(portal);

  // Recessed courtyard-facing storefront and stepped upper-level massing.
  box(19,11.5,38,-59.5,5.75,cafeZ,diningStucco);
  box(19.5,.42,38.5,-59.5,11.71,cafeZ,roof);
  for(const dz of [-14.75,14.75]){
    box(23,14,8.5,-38.5,7,cafeZ+dz,diningStucco);
    box(23.4,.4,8.8,-38.5,14.2,cafeZ+dz,roof);
    box(12,2.2,7,-40,15.5,cafeZ+dz,stone);
    // Windows on the outside elevation and facing the library.
    for(const y of [4,8,12]){
      for(const dx of [-7.5,0,7.5]){
        box(2.2,1.8,.16,-38.5+dx,y,cafeZ+dz+Math.sign(dz)*4.33,glass);
        box(2.65,.24,.4,-38.5+dx,y-1,cafeZ+dz+Math.sign(dz)*4.45,light);
      }
    }
  }
  box(25,.6,38,-39.5,17.2,cafeZ,roof);
  box(25,.32,.32,-39.5,17.66,cafeZ-18.8,stone);
  box(25,.32,.32,-39.5,17.66,cafeZ+18.8,stone);
  // Ribbed sloping soffit above the shaded passage, visible through the arch.
  for(let z=cafeZ-8;z<=cafeZ+8;z+=1.6){
    const rib=box(19,.3,.22,-38.4,13.5,z,diningShade);
    rib.rotation.z=.085;
  }
  // Glazed cafe frontage inside the arch, not a second freestanding building.
  box(.16,3.6,15,-49.88,2.2,cafeZ,glass);
  for(let dz=-7.5;dz<=7.5;dz+=2.5)
    box(.24,3.7,.12,-49.73,2.2,cafeZ+dz,diningFrame);
  box(.4,.5,15.4,-49.67,4.25,cafeZ,diningTrim);
  box(22,.3,19,-38.7,.15,cafeZ,paving);

  // Raised outdoor cafe seating deck and three broad stone steps.
  box(11,.75,26,-19.5,.375,cafeZ,light);
  for(let i=0;i<3;i++) box(1.2,.25*(3-i),26,-13.4+i*1.2,.125*(3-i),cafeZ,stone);
  const picnicTable=(x:number,z:number,base:number,umbrella:boolean)=>{
    box(2.8,.15,1.1,x,base+1.03,z,bench);
    for(const dx of [-.92,.92]){
      box(.13,1,.68,x+dx,base+.5,z,diningFrame);
    }
    for(const side of [-1,1]){
      box(2.8,.13,.36,x,base+.54,z+side*.96,bench);
      for(const dx of [-.92,.92]) box(.13,.51,.23,x+dx,base+.255,z+side*.96,diningFrame);
    }
    if(umbrella){
      cylinder(.055,.055,2.9,x,base+1.45,z,diningFrame,8);
      cylinder(0,1.7,.48,x,base+2.88,z,umbrellaFabric,12);
    }
  };
  for(const z of [-106,-99,-92,-85]) picnicTable(-19.5,z,.75,true);

  // Relish occupies the rear of the same Everyday Facilities building as Cilantro.
  // Its label anchors to the existing rear mass; no separate pavilion is modeled.
  // Connecting path toward the original hall and existing pergola.
  box(20,.12,9,-21,.06,-174,paving);

  // University Residences (original on-campus complex).
  // Sources: AUC NCmap.pdf (19), AUC Residence Models (12 residential units),
  // and Legorreta's American University in Cairo, Student Residences photographs.
  // Location, massing and dimensions below are indicative, not surveyed footprints.
  // Future Campus 2026 residences are deliberately not represented here.
  const dormOrange = mat("#b96643"), dormRust = mat("#a95438"),
    dormOchre = mat("#ca7951"), dormSill = mat("#86523c"),
    dormRoof = mat("#dcd0b9"), dormShade = mat("#88775f"),
    dormSoil = mat("#c9bc9c"), dormGarden = mat("#a4ad84");
  // Batch static architectural details by material; each batch shares a cube.
  const dormParts = new Map<THREE.Material, number[][]>();
  const dormBox = (w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material) => {
    const parts = dormParts.get(m) ?? [];
    parts.push([w,h,d,x,y,z]);
    dormParts.set(m,parts);
  };
  // A broad residential precinct on the library side of the Campus Center,
  // with an entrance from the existing pedestrian network.
  dormBox(146,.12,143,-88,.06,-280,dormSoil);
  dormBox(16,.16,44,-21,.08,-198,paving);
  dormBox(62,.18,13,-50,.09,-216,paving);
  dormBox(18,.16,127,-87,.09,-283,paving);
  for(const z of [-245,-281,-317]) dormBox(140,.18,5,-88,.09,z+17,paving);
  // Courtyard-based cottages: open sides, stepped upper floors and roof terraces.
  // Twelve residential units are represented, without assigning private unit names.
  const cottage = (x:number,z:number,variant:number,openSide:1|-1) => {
    const color = [dormOrange,dormRust,dormOchre][variant%3];
    const wing = (w:number,d:number,h:number,wx:number,wz:number) => {
      dormBox(w,h,d,wx,h/2+.12,wz,color);
      dormBox(w+.16,.22,d+.16,wx,h+.23,wz,dormRoof);
      // Short parapets with a pale cap, characteristic flat rooftop silhouettes.
      for(const side of [-1,1]){
        dormBox(w,.52,.24,wx,h+.58,wz+side*(d/2-.12),color);
        dormBox(.24,.52,d,wx+side*(w/2-.12),h+.58,wz,color);
      }
      const floors=Math.round(h/3.15);
      for(let f=0;f<floors;f++){
        const y=1.85+f*3.15;
        for(const side of [-1,1]){
          for(let dx=-w/2+2.1;dx<=w/2-1.9;dx+=3.25){
            dormBox(1.3,1.35,.12,wx+dx,y,wz+side*(d/2+.07),dormSill);
            dormBox(.93,1.01,.13,wx+dx,y,wz+side*(d/2+.14),glass);
          }
          for(let dz=-d/2+2.1;dz<=d/2-1.9;dz+=3.25){
            dormBox(.12,1.35,1.3,wx+side*(w/2+.07),y,wz+dz,dormSill);
            dormBox(.13,1.01,.93,wx+side*(w/2+.14),y,wz+dz,glass);
          }
        }
      }
    };
    // U-shaped arrangement opens onto a common garden rather than a solid block.
    wing(24,7.5,9.45,x,z-openSide*8.25);
    wing(7.5,16,variant%2===0?9.45:6.3,x-8.25,z+openSide*3.5);
    wing(7.5,16,variant%2===0?6.3:9.45,x+8.25,z+openSide*3.5);
    dormBox(8.4,.13,14,x,.16,z+openSide*3.6,paving);
    dormBox(3.5,.16,5.5,x,.23,z+openSide*4.6,dormGarden);
    // Small tree in the courtyard and low garden wall framing the opening.
    dormBox(.28,2.4,.28,x,1.4,z+openSide*4.6,trunk);
    const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(1.55,1),leaf2);
    tree.position.set(x,3,z+openSide*4.6);tree.castShadow=true;root.add(tree);
    for(const dx of [-8.5,8.5]) dormBox(6.5,1.1,.35,x+dx,.65,z+openSide*12,dormRust);
    // Light rooftop shade on alternating wings.
    const sx=x+(variant%2===0?-8.25:8.25), sz=z+openSide*3.5;
    for(const dx of [-2.6,2.6]) for(const dz of [-5,5])
      dormBox(.22,1.6,.22,sx+dx,10.4,sz+dz,dormShade);
    for(let dz=-5;dz<=5;dz+=1.25)
      dormBox(5.7,.2,.23,sx,11.2,sz+dz,dormShade);
  };
  const residenceRows = [
    {z:-247, xs:[-144,-113,-61,-30], offsets:[0,-3,1,-2]},
    {z:-282, xs:[-144,-113,-61,-30], offsets:[2,0,-2,1]},
    {z:-317, xs:[-144,-113,-61,-30], offsets:[0,2,0,-3]},
  ];
  residenceRows.forEach((row,r)=>row.xs.forEach((x,i)=>
    cottage(x,row.z+row.offsets[i],r*4+i,r%2===0?1:-1)));
  // Stone-clad shared entrance and common facilities at the approach plaza.
  dormBox(36,.16,14,-87,.1,-218,paving);
  for(const x of [-103,-71]){
    dormBox(10,7.5,12,x,3.85,-217,stone);
    dormBox(10.4,.35,12.4,x,7.8,-217,dormRoof);
    dormBox(2.1,2.8,.18,x,1.6,-210.9,glass);
    dormBox(2.2,1.6,.18,x,5.3,-210.9,glass);
  }
  dormBox(22,4.1,7,-87,2.15,-221,dormOrange);
  dormBox(22.3,.3,7.3,-87,4.35,-221,dormRoof);
  // Open stone colonnade along the shared entrance and central residential walk.
  for(const z of [-235,-244,-253,-262,-271,-280,-289,-298,-307,-316,-325]){
    for(const x of [-95,-79]) dormBox(.65,3.5,.65,x,1.85,z,stone);
    dormBox(17,.3,.5,-87,3.8,z,dormShade);
  }
  for(const x of [-95,-91,-87,-83,-79])
    dormBox(.34,.25,94,x,4.05,-280,dormShade);
  // Low landscape beds, seating and small palms confined to the residences.
  for(const z of [-240,-274,-309]){
    for(const x of [-74,-100]){
      dormBox(4.5,.18,5,x,.19,z,dormGarden);
      palm(x,z);
      dormBox(2.2,.48,.65,x,.32,z+3.3,bench);
    }
  }
  const dormGeometry = new THREE.BoxGeometry(1,1,1);
  const dormTransform = new THREE.Object3D();
  for(const [material,parts] of dormParts){
    const mesh=new THREE.InstancedMesh(dormGeometry,material,parts.length);
    parts.forEach(([w,h,d,x,y,z],i)=>{
      dormTransform.scale.set(w,h,d);dormTransform.position.set(x,y,z);
      dormTransform.updateMatrix();mesh.setMatrixAt(i,dormTransform.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
    mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);
  }

  // Animated continuous streams, gravity-driven spray and local impact ripples.
  const waterAnimations: ((seconds: number) => void)[] = [];
  const flowTime = { value: 0 };
  const streamMaterial = new THREE.MeshPhysicalMaterial({
    color: "#b9e4e7", roughness: .12, metalness: 0,
    clearcoat: 1, clearcoatRoughness: .08,
    transparent: true, opacity: .88, depthWrite: false,
  });
  // Subtle traveling highlights and lateral turbulence, not segmented/dashed jets.
  streamMaterial.onBeforeCompile = shader => {
    shader.uniforms.uFlowTime = flowTime;
    shader.vertexShader = "uniform float uFlowTime; varying vec2 vFlowUv;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
      #include <begin_vertex>
      vFlowUv = uv;
      float flow = sin(uv.x * 24.0 - uFlowTime * 13.0 + position.x * 2.0 + position.z * 3.0);
      float envelope = sin(uv.x * 3.14159265) * smoothstep(0.12, 0.65, uv.x);
      transformed.x += flow * envelope * 0.035;
      transformed.z += cos(uv.x * 19.0 - uFlowTime * 11.0 + position.z) * envelope * 0.027;
    `);
    shader.fragmentShader = "uniform float uFlowTime; varying vec2 vFlowUv;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
      #include <color_fragment>
      float shimmer = 0.5 + 0.5 * sin(vFlowUv.x * 43.0 - uFlowTime * 19.0 + vFlowUv.y * 6.2831853);
      float fine = 0.5 + 0.5 * sin(vFlowUv.x * 97.0 - uFlowTime * 31.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.98, 1.0), 0.12 + 0.18 * shimmer * fine);
      diffuseColor.a *= 0.83 + 0.17 * shimmer;
    `);
  };
  const dropMaterial = new THREE.MeshPhysicalMaterial({
    color: "#d9f3f3", roughness: .15, clearcoat: .85,
    transparent: true, opacity: .76, depthWrite: false,
  });
  const dropGeometry = new THREE.SphereGeometry(1, 8, 6);
  const rippleGeometry = new THREE.RingGeometry(.9, 1, 48);
  const jetCount = 8, dropsPerJet = 16, splashPerJet = 7;
  const dropTransform = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3();
  const fract = (n: number) => n - Math.floor(n);
  const noise = (n: number) => fract(Math.sin(n * 127.1 + 31.7) * 43758.5453);
  for(const z of [-30,28]){
    box(10,.22,10,0,.12,z,band);
    cylinder(2.35,2.35,.45,0,.45,z,stone,32);
    const surface = cylinder(1.95,1.95,.08,0,.72,z,water,32);
    surface.material = new THREE.MeshPhysicalMaterial({
      color: "#90bfbc", roughness: .23, clearcoat: .9, clearcoatRoughness: .13,
    });
    cylinder(.37,.5,.55,0,.94,z,light);
    const fountain = new THREE.Group();
    fountain.position.z = z;
    root.add(fountain);
    const jets = Array.from({length:jetCount}, (_,j) => ({
      angle: j * Math.PI * 2 / jetCount,
      reach: 1.41 + noise(j + z) * .21,
      lift: 4.35 + noise(j + z + 24) * .65,
      speed: .91 + noise(j + z + 52) * .16,
    }));
    const path = (jet: typeof jets[number], t: number) => {
      const radius = .13 + jet.reach * t;
      return new THREE.Vector3(
        Math.cos(jet.angle) * radius,
        1.22 - .45 * t + jet.lift * t * (1 - t),
        Math.sin(jet.angle) * radius
      );
    };
    for(const jet of jets){
      const points=Array.from({length:33},(_,i)=>path(jet,i/32));
      const curve=new THREE.CatmullRomCurve3(points);
      const tube = new THREE.TubeGeometry(curve,48,.074,8,false);
      // Slightly taper the coherent core toward the landing point.
      const positions = tube.attributes.position;
      const uv = tube.attributes.uv;
      const center = new THREE.Vector3();
      for(let i=0;i<positions.count;i++){
        const t=uv.getX(i);
        curve.getPointAt(t,center);
        const taper=1-.43*t*t;
        positions.setXYZ(i, center.x+(positions.getX(i)-center.x)*taper,
          center.y+(positions.getY(i)-center.y)*taper,
          center.z+(positions.getZ(i)-center.z)*taper);
      }
      positions.needsUpdate=true;
      tube.computeVertexNormals();
      fountain.add(new THREE.Mesh(tube,streamMaterial));
    }
    const drops=new THREE.InstancedMesh(dropGeometry,dropMaterial,jetCount*dropsPerJet);
    const splashes=new THREE.InstancedMesh(dropGeometry,dropMaterial,jetCount*splashPerJet);
    for(const mesh of [drops,splashes]){
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled=false;
      fountain.add(mesh);
    }
    const ripples=jets.flatMap((jet,j)=>Array.from({length:2},(_,i)=>{
      const material=new THREE.MeshBasicMaterial({
        color:"#d6efeb",transparent:true,opacity:.3,depthWrite:false,side:THREE.DoubleSide,
      });
      const ripple=new THREE.Mesh(rippleGeometry,material);
      ripple.rotation.x=-Math.PI/2;
      ripple.position.copy(path(jet,1));
      ripple.position.y=.765;
      fountain.add(ripple);
      return { ripple, offset:j*.173+i*.5 };
    }));
    waterAnimations.push(seconds=>{
      flowTime.value=seconds;
      jets.forEach((jet,j)=>{
        const dx=Math.cos(jet.angle), dz=Math.sin(jet.angle);
        for(let i=0;i<dropsPerJet;i++){
          const seed=j*dropsPerJet+i+z*31;
          const t=fract(seconds*jet.speed+noise(seed)*1.7);
          const separation=.018+.09*t*t;
          const drift=Math.sin(seed*2.31+seconds*9)*separation;
          const radius=.13+jet.reach*t;
          dropTransform.position.set(dx*radius-dz*drift,
            1.22-.45*t+jet.lift*t*(1-t)+Math.sin(seed)*.045*t,
            dz*radius+dx*drift);
          tangent.set(dx*jet.reach,-.45+jet.lift*(1-2*t),dz*jet.reach).normalize();
          dropTransform.quaternion.setFromUnitVectors(up,tangent);
          const size=(.025+noise(seed+90)*.027)*(.65+.35*t);
          dropTransform.scale.set(size,size*(1.4+Math.abs(1-2*t)),size);
          dropTransform.updateMatrix();
          drops.setMatrixAt(j*dropsPerJet+i,dropTransform.matrix);
        }
        for(let i=0;i<splashPerJet;i++){
          const seed=500+j*splashPerJet+i+z*13;
          const t=fract(seconds*(2.3+noise(seed)*.7)+noise(seed+9));
          const angle=jet.angle+(noise(seed+18)-.5)*Math.PI*1.6;
          const travel=(.06+noise(seed+29)*.20)*t;
          const end=.13+jet.reach;
          dropTransform.position.set(dx*end+Math.cos(angle)*travel,
            .77+(0.38+noise(seed+38)*.58)*t*(1-t),
            dz*end+Math.sin(angle)*travel);
          dropTransform.quaternion.identity();
          const size=(.024+noise(seed+48)*.025)*Math.sin(Math.PI*t);
          dropTransform.scale.setScalar(size);
          dropTransform.updateMatrix();
          splashes.setMatrixAt(j*splashPerJet+i,dropTransform.matrix);
        }
      });
      drops.instanceMatrix.needsUpdate=true;
      splashes.instanceMatrix.needsUpdate=true;
      ripples.forEach(({ripple,offset})=>{
        const phase=fract(seconds*1.65+offset);
        ripple.scale.setScalar(.025+.23*phase);
        ripple.material.opacity=.46*(1-phase)*Math.min(1,phase*8);
      });
    });
  }
  // Preserve only the perimeter tree row on the Sciences & Engineering side.
  for(const x of [91]){
    box(14,.15,193,x,.05,0,green);
    for(let z=-88;z<95;z+=13){
      cylinder(.24,.35,3.5,x,1,z,trunk);
      const t=new THREE.Mesh(new THREE.IcosahedronGeometry(2.8,1),leaf2);t.position.set(x,3.6,z);t.scale.y=1.1;t.castShadow=true;root.add(t);
    }
  }
  const animateWater = (seconds: number) => waterAnimations.forEach(update => update(seconds));
  animateWater(0);
  return { root, animateWater, libraryFallback };
}
