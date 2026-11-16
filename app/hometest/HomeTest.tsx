"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DEGREE_REQUIREMENTS } from "../../data/degree-requirements";
import { courses, type Course } from "../../data/courses";
import HomeSearch from "../../features/home/HomeSearch";
import "./hometest.css";

type Region = { id:string; name:string; short:string; x:number; y:number; emblem:string; majors:string[] };
type DegreeGroup = { title?:string; scope?:string; items?:string[]; subgroups?: {title?:string;items?:string[]}[] };
type DegreePlan = { groups?:DegreeGroup[]; note?:string };
type CourseEntry = { code:string; title:string; course?:Course; group:string };
type View =
  | { type:"world" }
  | { type:"region"; regionId:string }
  | { type:"major"; regionId:string; major:string; groupIndex:number; page:number }
  | { type:"course"; regionId:string; major:string; groupIndex:number; page:number; entry:CourseEntry };

const regionDefinitions:Region[] = [
  {id:"engineering",name:"Sciences & Engineering",short:"ENGINEERING & SCIENCES",x:59.2,y:24,emblem:"temple",majors:[
    "Mechanical Engineering","Computer Science","Computer Engineering","Electronics and Communications Engineering","Construction Engineering","Petroleum Engineering",
    "Data Science","Physics","Chemistry","Mathematics","Biology","Actuarial Science","Architecture"
  ]},
  {id:"business",name:"Business",short:"BUSINESS",x:33.2,y:22,emblem:"temple",majors:[
    "Business and Entrepreneurship","Business in Finance","Business in Marketing","Accounting","Management of Information and Communication Technology"
  ]},
  {id:"humanities",name:"Humanities & Social Sciences",short:"HUMANITIES & SOCIAL SCIENCES",x:32.1,y:66.5,emblem:"archive",majors:[
    "Political Science","Economics","Psychology","Sociology","Anthropology","History","Philosophy","Egyptology","Middle East Studies",
    "English and Comparative Literature","Arabic Studies"
  ]},
  {id:"arts",name:"Arts & Communication",short:"ARTS & COMMUNICATION",x:78,y:65.5,emblem:"arts",majors:[
    "Graphic Design","Visual Arts","Film","Theatre","Music","Multimedia Communication and Journalism","Integrated Marketing Communication"
  ]},
];

const allPlans = DEGREE_REQUIREMENTS as Record<string,DegreePlan>;
const courseByCode = new Map(courses.map(c => [c.code.toUpperCase(),c]));
const availableRegions = regionDefinitions.map(region=>({...region,majors:region.majors.filter(major=>Boolean(allPlans[major]))}));

function canonicalSlug(value:string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function hrefForCourse(code:string) {return "/courses/"+canonicalSlug(code);}
function extractEntries(group:DegreeGroup):CourseEntry[] {
  const listed = [...(group.items||[]),...(group.subgroups||[]).flatMap(g=>g.items||[])];
  const seen = new Set<string>();
  const result:CourseEntry[]=[];
  for (const raw of listed) {
    const match = raw.match(/^([A-Z]{2,6}\s+\d{3,4}[A-Z]?)\s*-\s*(.*)$/i);
    if(!match)continue;
    const code=match[1].toUpperCase().replace(/\s+/g," ");
    if(seen.has(code))continue;
    seen.add(code);
    const existing=courseByCode.get(code);
    const title=existing?.title||match[2].replace(/\s*\([^()]*cr\.?[^()]*\)\s*$/i,"").trim()||code;
    result.push({code,title,course:existing,group:group.title||group.scope||"Degree requirements"});
  }
  return result;
}
function planGroups(major:string) {
  return (allPlans[major]?.groups||[]).map((group,index)=>({...group,index,entries:extractEntries(group)}))
    .filter(group=>group.entries.length>0);
}

function Compass({small=false}:{small?:boolean}) {
  return <svg className={small?"atlas-compass is-small":"atlas-compass"} viewBox="0 0 150 150" aria-hidden="true">
    <circle cx="75" cy="75" r="58" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".8"/>
    <circle cx="75" cy="75" r="45" fill="none" stroke="currentColor" strokeWidth=".7" opacity=".6"/>
    <path d="M75 8 87 65 142 75 87 85 75 142 63 85 8 75 63 65Z" fill="#a17a3e" fillOpacity=".75" stroke="#58452f" strokeWidth="1.5"/>
    <path d="M75 12 75 75 87 65Z M75 75 63 85 75 138Z M75 75 138 75 87 85Z M12 75 63 65 75 75Z" fill="#eee0c2" stroke="#58452f" strokeWidth=".7"/>
    <circle cx="75" cy="75" r="7" fill="#56412b"/><circle cx="75" cy="75" r="3" fill="#e8d0a5"/>
    <g fontSize="12" fontFamily="Georgia, serif" fill="#4e3a25" textAnchor="middle"><text x="75" y="7">N</text><text x="75" y="149">S</text><text x="5" y="79">W</text><text x="145" y="79">E</text></g>
  </svg>;
}

function Mountain({x,y,s=1}:{x:number;y:number;s?:number}) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke="#6b563c" strokeWidth="1.6" strokeLinejoin="round" opacity=".79">
    <path d="M-100 25-40-42-14-15 30-86 104 25Z" fill="#b39a6e" fillOpacity=".34"/>
    <path d="M-100 25-40-42-14-15 30-86 104 25" strokeWidth="2.5"/>
    <path d="m-58 0 18-42 14 24m14 19 42-87 34 50m-25-24-9 23 18-7m13 25-9-29" strokeWidth="1.2"/>
    <path d="m-55 20 30-8 34 5m23-3 26-17 25 19" strokeWidth=".9"/>
  </g>;
}
function Palm({x,y,s=1}:{x:number;y:number;s?:number}) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" strokeLinecap="round" opacity=".77">
    <path d="M0 0 Q-7-30 4-75" stroke="#70563a" strokeWidth="5"/>
    {[-70,-45,-20,8,30,55,78].map((a,i)=>{
      const theta=a*Math.PI/180;return <path key={a} d={`M4 -75 Q${Math.sin(theta)*29} ${-98+Math.cos(theta)*7} ${Math.sin(theta)*57} ${-78+Math.cos(theta)*19}`}
        stroke="#596044" strokeWidth={i%2?4:5}/>;
    })}
  </g>;
}
function Building({x,y,s=1,variant="temple"}:{x:number;y:number;s?:number;variant?:"temple"|"tower"|"arch"|"dome"|"archive"|"arts"}) {
  const isDome=variant==="dome", isTower=variant==="tower";
  return <g transform={`translate(${x} ${y}) scale(${s})`} stroke="#6f5231" strokeWidth="2" strokeLinejoin="round">
    <path d="M-84 38H87v14H-84Z" fill="#b69a70"/><path d="M-74 28H77v13H-74Z" fill="#d4b78a"/>
    {isTower?<><path d="M-20-108H27V29H-20Z" fill="#d9bc8f"/><path d="M-32-108 4-144 40-108Z" fill="#b69665"/><path d="M-21-61H28M-21-17H28" fill="none" strokeWidth="5"/><path d="M-4-89H14V-66H-4ZM-4-46H14V-23H-4Z" fill="#856b47"/></>:isDome?<><path d="M-75 0H74V30H-75Z" fill="#d8bf93"/><path d="M-60 0Q0-96 60 0Z" fill="#b99c73"/><path d="M0-92V-115" fill="none" strokeWidth="4"/><circle cx="0" cy="-118" r="4" fill="#9b7846"/></>:<>
      <path d="M-83-10H82V29H-83Z" fill="#ddc69e"/>
      <path d="M-92-19H91L70-48H-70Z" fill="#ad8659"/>
      <path d="M-98-22H96" strokeWidth="5"/>
      {[-56,-23,10,43].map(i=><g key={i}><rect x={i} y="-10" width="14" height="39" fill="#d1b38b"/><path d={`M${i-4} -11h22M${i-4} 27h22`} strokeWidth="3"/></g>)}
      <path d="M-72 8H71" fill="none" strokeWidth="1"/>
    </>}
    <path d="M-76 38H78" strokeWidth="4"/>
    <g fill="#7b674e" stroke="none">{Array.from({length:8},(_,i)=><rect key={i} x={-70+i*20} y="33" width="9" height="3"/>)}</g>
  </g>;
}

const MAP_POSITIONS = [
  {x:31,y:24},{x:56,y:20},{x:81,y:29},{x:28,y:52},{x:55,y:54},{x:80,y:58},
  {x:38,y:77},{x:65,y:79}
];

function MapArtwork({variant="world"}:{variant?:"world"|"region"|"major"}) {
  return <svg className={`am-artwork am-artwork--${variant}`} viewBox="0 0 1200 670" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Hand-drawn antique academic map showing landmarks, mountains and pathways">
    <defs>
      <pattern id="am-paper-lines" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M3 4h4m13 16h3m-21 2h2" stroke="#997a54" strokeWidth=".55" opacity=".18"/></pattern>
      <pattern id="am-tile" width="26" height="20" patternUnits="userSpaceOnUse"><path d="M0 0H26M0 10H26M13 0V10M0 10V20" fill="none" stroke="#97764f" strokeWidth=".9" opacity=".47"/></pattern>
      <linearGradient id="am-terrain" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#cfb78c"/><stop offset=".6" stopColor="#d4bc91"/><stop offset="1" stopColor="#ad9068"/></linearGradient>
    </defs>
    <path d="M118 215Q185 110 325 84L460 103 576 55Q680 23 800 80L975 65Q1070 108 1100 210L1168 265 1140 423Q1091 539 953 551L805 602 668 561Q545 627 420 559L259 590Q122 540 105 428L65 361Z"
      fill="#a78b5b" fillOpacity=".25" stroke="#755c3b" strokeWidth="3" />
    <path d="M136 199Q182 119 321 102L465 119 574 73Q675 43 796 98L970 82Q1049 115 1080 220L1144 274 1124 417Q1075 515 948 529L802 576 665 538Q548 600 430 538L260 565Q145 514 129 422L91 354Z"
      fill="url(#am-terrain)" stroke="#695438" strokeWidth="2"/>
    <path d="M136 199Q182 119 321 102L465 119 574 73Q675 43 796 98L970 82Q1049 115 1080 220L1144 274 1124 417Q1075 515 948 529L802 576 665 538Q548 600 430 538L260 565Q145 514 129 422L91 354Z"
      fill="url(#am-paper-lines)"/>
    <g fill="none" stroke="#886944" strokeWidth="1.3" opacity=".5">
      <path d="M111 290Q180 190 228 176t130-63M131 327Q185 226 241 209t168-74M1112 333Q1053 399 1001 427t-115 120M995 105Q914 143 885 190t-42 135M211 470q130-21 218 4t166 35"/>
      <path d="M169 395q84-33 154 15t168 24q77-20 154-14t120-50q64-51 126-28"/>
      <path d="M219 502q157-16 246 19t147-10M827 146q46-39 113-13t110 91" strokeDasharray="3 7"/>
    </g>
    <g className="am-mountain-layer">
      <Mountain x={331} y={155} s={1.06}/><Mountain x={568} y={142} s={.95}/>
      <Mountain x={824} y={166} s={1.11}/><Mountain x={998} y={182} s={.82}/>
      <Mountain x={273} y={385} s={.77}/><Mountain x={1010} y={435} s={.86}/>
    </g>
    <g fill="none" stroke="#ac8854" strokeWidth="16" strokeLinecap="round" opacity=".73">
      <path d="M584 455Q517 376 516 324T490 193M584 455Q623 395 735 339T863 188M584 455Q445 459 335 428T296 329M584 455Q744 464 870 453T949 403"/>
    </g>
    <g fill="none" stroke="#ede0bd" strokeWidth="9" strokeLinecap="round" opacity=".86">
      <path d="M584 455Q517 376 516 324T490 193M584 455Q623 395 735 339T863 188M584 455Q445 459 335 428T296 329M584 455Q744 464 870 453T949 403"/>
    </g>
    <g>
      <Building x={348} y={244} s={.66} variant="temple"/>
      <Building x={673} y={212} s={.86} variant="temple"/>
      <Building x={963} y={263} s={.80} variant="dome"/>
      <Building x={335} y={445} s={.78} variant="arch"/>
      <Building x={922} y={464} s={.74} variant="arts"/>
      <Building x={609} y={494} s={1.32} variant="tower"/>
    </g>
    <g opacity=".76">
      <Palm x={252} y={367} s={.9}/><Palm x={470} y={451} s={.8}/><Palm x={795} y={443} s={.9}/>
      <Palm x={1067} y={414} s={.65}/><Palm x={367} y={525} s={.7}/><Palm x={736} y={536} s={.62}/>
      <Palm x={189} y={326} s={.54}/><Palm x={988} y={514} s={.43}/>
    </g>
    {Array.from({length:26},(_,i)=>{
      const x=165+(i*157)%875,y=175+(i*83)%320;
      return <path key={i} d={`M${x} ${y}q8-14 19 0m-12 9q7-10 16 1`} fill="none" stroke="#766747" strokeWidth="1.2" opacity=".35"/>;
    })}
    <path d="M52 510Q65 499 94 504t51 20M994 568q53-19 96-2m-940-408q30-31 65-38" fill="none" stroke="#614b2f" strokeWidth="1.2"/>
  </svg>;
}

function RegionTitle({region,action}:{region:Region;action:()=>void}) {
  return <button className="am-territory" style={{left:region.x+"%",top:region.y+"%"}} onClick={action}>
    <span className="am-territory-name">{region.short}</span>
    <span className="am-territory-hint">DISCOVER ↗</span>
  </button>;
}

export default function HomeTest() {
  const [view,setView]=useState<View>({type:"world"});
  const [searchOpen,setSearchOpen]=useState(false);
  const [showAllMajors,setShowAllMajors]=useState(false);
  const [pageTransition,setPageTransition]=useState(0);
  
  const searchRef=useRef<HTMLDivElement>(null);
  const activeRegion=view.type==="world"?null:availableRegions.find(r=>r.id===view.regionId)||null;
  const major=view.type==="major"||view.type==="course"?view.major:null;
  const groups=useMemo(()=>major?planGroups(major):[],[major]);
  const selectedGroup=view.type==="major"||view.type==="course"?groups.find(group=>group.index===view.groupIndex)||groups[0]:undefined;
  const activeEntry=view.type==="course"?view.entry:null;
  const entries=selectedGroup?.entries||[];
  const PAGE_SIZE=8;
  const maxPages=Math.max(1,Math.ceil(entries.length/PAGE_SIZE));
  const pageNum=view.type==="major"||view.type==="course"?Math.min(maxPages-1,view.page):0;
  const visibleEntries=entries.slice(pageNum*PAGE_SIZE,(pageNum+1)*PAGE_SIZE);

  useEffect(()=>{if(searchOpen)searchRef.current?.querySelector<HTMLInputElement>("input")?.focus();},[searchOpen]);
  useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(e.key==="Escape"){setSearchOpen(false);if(view.type==="course")goBack();}};document.addEventListener("keydown",handler);return()=>document.removeEventListener("keydown",handler);},[view]);
  function navigate(next:View){setView(next);setPageTransition(n=>n+1);}
  function openRegion(region:Region){navigate({type:"region",regionId:region.id});}
  function openMajor(regionId:string,selectedMajor:string){navigate({type:"major",regionId,major:selectedMajor,groupIndex:0,page:0});}
  function selectGroup(index:number){if(!major||!activeRegion)return;navigate({type:"major",regionId:activeRegion.id,major,groupIndex:index,page:0});}
  function goBack(){
    if(view.type==="course")navigate({type:"major",regionId:view.regionId,major:view.major,groupIndex:view.groupIndex,page:view.page});
    else if(view.type==="major")navigate({type:"region",regionId:view.regionId});
    else if(view.type==="region")navigate({type:"world"});
  }
  function showCourse(entry:CourseEntry){if(view.type!=="major")return;navigate({...view,type:"course",entry});}
  function cyclePage(delta:number){
    if(view.type!=="major")return;
    navigate({...view,page:Math.max(0,Math.min(maxPages-1,pageNum+delta))});
  }
  return <main className="ancient-atlas">
    <section className="am-frame" aria-label="Explore AUC academic map">
      <div className="am-map" data-scene={view.type}>
        <MapArtwork variant={view.type==="world"?"world":view.type==="region"?"region":"major"}/>
        <div className="am-engraving-corners" aria-hidden="true"/>
        {view.type==="world" ? <>
          <div className="am-intro">
            <span className="am-intro-edition">THE UNOFFICIAL STUDENT GUIDE</span>
            <h1>AUC<br/>ATLAS<span>.</span></h1>
            <div className="am-intro-line"/>
            <p>The unofficial map of<br/>AUC&apos;s academic world.</p>
          </div>
          <div className="am-compass-world"><Compass/></div>
          {availableRegions.map(region=><RegionTitle key={region.id} region={region} action={()=>openRegion(region)}/>)}
          <div className="am-campus-legend">THE AMERICAN<br/>UNIVERSITY IN CAIRO</div>
        </>:null}

        {view.type==="region" && activeRegion?<>
          <div className="am-world-subtitle am-back-region">
            <button type="button" className="am-text-back" onClick={goBack}>← RETURN TO THE MAP</button>
            <span>REGION / {activeRegion.short}</span>
            <h2>{activeRegion.name}</h2>
            <p>Choose a major to explore its degree requirements.</p>
          </div>
          <div className="am-landmark-region">
            {activeRegion.majors.slice(0,8).map((m,i)=><button key={m} className="am-major-label" style={{left:MAP_POSITIONS[i].x+"%",top:MAP_POSITIONS[i].y+"%"}} onClick={()=>openMajor(activeRegion.id,m)}>
              <span className="am-map-marker" aria-hidden="true">✦</span><span>{m}</span>
            </button>)}
          </div>
          {activeRegion.majors.length>8&&<div className="am-more-major"><button onClick={()=>setShowAllMajors(true)}>VIEW ALL MAJORS ↓</button></div>}
        </>:null}
        {view.type==="major" && activeRegion && major ? <>
          <div className="am-world-subtitle am-back-region">
            <button className="am-text-back" onClick={goBack}>← {activeRegion.name}</button>
            <span>DEGREE PATH / {activeRegion.short}</span>
            <h2>{major}</h2>
            <p>Follow course landmarks from the published Atlas degree plan.</p>
          </div>
          <div className="am-degree-group-control">
            <label htmlFor="am-requirement-group">REQUIREMENT CHAPTER</label>
            <select id="am-requirement-group" value={selectedGroup?.index ?? 0}
              onChange={event=>selectGroup(Number(event.target.value))}
              aria-label="Choose an area of degree requirements">
              {groups.map(group=><option value={group.index} key={group.index}>{group.title||group.scope||"Degree requirements"}</option>)}
            </select>
            <span>{entries.length} courses in this chapter · {pageNum+1} of {maxPages}</span>
          </div>
          <div className="am-trail" aria-hidden="true">
            <svg viewBox="0 0 1000 580" preserveAspectRatio="none"><path d="M210 148C400 75 610 117 710 165S700 313 490 285 225 380 430 463 750 460 765 520" stroke="#6b4928" strokeWidth="4" strokeDasharray="7 12" fill="none" opacity=".55"/></svg>
          </div>
          <div className="am-landmark-region am-course-landmarks">
            {visibleEntries.map((entry,i)=><button key={entry.code} className="am-major-label am-course-label" style={{left:MAP_POSITIONS[i].x+"%",top:MAP_POSITIONS[i].y+"%"}} onClick={()=>showCourse(entry)}>
              <span className="am-map-marker" aria-hidden="true">✦</span><b>{entry.code}</b><small>{entry.title}</small>
            </button>)}
          </div>
          <div className="am-course-pagination">
            <button onClick={()=>cyclePage(-1)} disabled={pageNum<=0} aria-label="Previous course landmarks">‹</button>
            <span>{pageNum+1} / {maxPages}</span>
            <button onClick={()=>cyclePage(1)} disabled={pageNum+1>=maxPages} aria-label="Next course landmarks">›</button>
          </div>
        </>:null}
        {view.type==="course"&&activeRegion&&major&&activeEntry?<div className="am-scroll" role="region" aria-label={"Course details for "+activeEntry.code}>
          <button className="am-scroll-close" onClick={goBack} aria-label="Close course details">×</button>
          <button className="am-text-back" onClick={goBack}>← BACK TO {major.toUpperCase()}</button>
          <span className="am-scroll-code">{activeEntry.code}</span>
          <h2>{activeEntry.title}</h2>
          <p className="am-scroll-description">{activeEntry.course?.description||"This course appears in AUC Atlas degree requirements. Open its course page for the full information."}</p>
          <div className="am-scroll-metadata">
            <div><span>REQUIREMENT AREA</span><b>{activeEntry.group}</b></div>
            <div><span>PREREQUISITES</span><b>{activeEntry.course?.prerequisite||"Refer to full course page"}</b></div>
          </div>
          <div className="am-scroll-links">
            <a href={hrefForCourse(activeEntry.code)}>OPEN COURSE PAGE ↗</a>
            <a href={hrefForCourse(activeEntry.code)+"#course-materials-access"}>STUDY MATERIALS ↗</a>
            <a href="/professors">PROFESSORS ↗</a>
          </div>
          <small>Degree requirements are for planning only; verify your catalogue year with AUC.</small>
        </div>:null}
        <div className="am-map-notice">ILLUSTRATED ACADEMIC ATLAS · NOT TO GEOGRAPHIC SCALE</div>
      </div>
      <div className="am-map-tools">
        <div className="am-tool-top"><span>EXPLORE BY</span><button type="button" className="am-search-trigger" onClick={()=>setSearchOpen(true)} aria-label="Search the Atlas"><span>⌕</span> SEARCH</button></div>
        <button type="button" className="am-tool-row" onClick={()=>{navigate({type:"world"});setShowAllMajors(false);}}>⌂ <span>Academic regions</span></button>
        <button type="button" className="am-tool-row" onClick={()=>setShowAllMajors(true)}>✦ <span>All majors</span></button>
        <button type="button" className="am-tool-row" onClick={()=>setSearchOpen(true)}>⌕ <span>Courses & professors</span></button>
        <span className="am-tool-foot">YOUR JOURNEY STARTS HERE</span>
      </div>
    </section>
    <div className="am-below-map">
      <span className="am-hint">SELECT A TERRITORY TO BEGIN EXPLORING</span>
      <span className="am-status">AUC ATLAS · A STUDENT-BUILT ACADEMIC RESOURCE</span>
    </div>
    {showAllMajors&&<div className="am-dialog-backdrop" onClick={()=>setShowAllMajors(false)}>
      <section className="am-contents" role="dialog" aria-modal="true" aria-labelledby="am-contents-title" onClick={e=>e.stopPropagation()}>
        <button className="am-dialog-close" onClick={()=>setShowAllMajors(false)} aria-label="Close major index">×</button>
        <span>THE COMPLETE INDEX</span><h2 id="am-contents-title">Find your major.</h2>
        {availableRegions.map(region=><div className="am-contents-section" key={region.id}>
          <h3>{region.name}</h3>
          {region.majors.map(m=><button key={m} onClick={()=>{setShowAllMajors(false);openMajor(region.id,m)}}>{m}<span>↗</span></button>)}
        </div>)}
      </section>
    </div>}
    {searchOpen&&<div className="am-dialog-backdrop" onClick={()=>setSearchOpen(false)}>
      <section className="am-search-sheet" role="dialog" aria-modal="true" aria-labelledby="am-search-title" ref={searchRef} onClick={e=>e.stopPropagation()}>
        <button className="am-dialog-close" onClick={()=>setSearchOpen(false)} aria-label="Close search">×</button>
        <span>THE ATLAS COMPASS</span><h2 id="am-search-title">What are you looking for?</h2>
        <p>Search any professor, course, or study resource directly.</p>
        <HomeSearch/>
      </section>
    </div>}
    <div className="am-preview-disclaimer">This is an experimental map of the Atlas curriculum, not an official AUC degree audit.</div>
  </main>;
}
