import { createHash, createHmac } from "node:crypto";

export class MaterialFileError extends Error {
  constructor(message: string, readonly statusCode: number) { super(message); }
}
const imageKitPath = /^\/auc-atlas\/materials\/[a-f0-9]{36}\.(?:pdf|docx?|pptx?|xlsx?|jpe?g|png)$/i;
const imageKitId = /^[a-f0-9]{24}$/i;
const cloudinaryPublicId = /^auc-atlas\/materials\/[a-f0-9]{36}\.(?:pdf|docx?|pptx?|xlsx?|jpe?g|png)$/i;
const cloudinaryAssetId = /^[A-Za-z0-9_-]{16,160}$/;
const clean = (v: unknown, limit: number) => String(v ?? "").trim().slice(0,limit);

function imageKitConfig() {
  const privateKey = clean(process.env.IMAGEKIT_PRIVATE_KEY,500);
  const endpoint = clean(process.env.IMAGEKIT_URL_ENDPOINT,500).replace(/\/+$/,"");
  const publicKey = clean(process.env.IMAGEKIT_PUBLIC_KEY,200);
  let url: URL;
  try { url = new URL(endpoint); } catch { throw new MaterialFileError("ImageKit course-material storage is not configured.",500); }
  if (!publicKey || !privateKey || url.protocol !== "https:" || url.search || url.hash ||
    url.username || url.password) throw new MaterialFileError("ImageKit course-material storage is not configured.",500);
  return { privateKey, endpoint };
}
async function imageKitMaterial(id: string) {
  const { privateKey } = imageKitConfig();
  const response = await fetch("https://api.imagekit.io/v1/files/"+id+"/details",{
    headers:{ Accept:"application/json",Authorization:"Basic "+Buffer.from(privateKey+":").toString("base64") },
    cache:"no-store"
  });
  if(response.status===404)throw new MaterialFileError("Course material file not found.",404);
  if(!response.ok)throw new MaterialFileError("Could not verify course material storage.",502);
  const file = await response.json();
  if (!file || file.fileId !== id) throw new MaterialFileError("Course material file not found.",404);
  return { path: clean(file.filePath,100), private: file.isPrivateFile===true };
}
function cloudinaryConfig() {
  let cloudName=clean(process.env.CLOUDINARY_CLOUD_NAME||process.env.CLOUDINARY_NAME,160);
  let apiKey=clean(process.env.CLOUDINARY_API_KEY,160);
  let apiSecret=clean(process.env.CLOUDINARY_API_SECRET,500);
  if ((!cloudName||!apiKey||!apiSecret)&&process.env.CLOUDINARY_URL) {
    try {
      const uri = new URL(process.env.CLOUDINARY_URL);
      if(uri.protocol==="cloudinary:"){
        cloudName ||= uri.hostname;
        apiKey ||= decodeURIComponent(uri.username);
        apiSecret ||= decodeURIComponent(uri.password);
      }
    }catch{}
  }
  if(!cloudName||!apiKey||!apiSecret)throw new MaterialFileError("Cloudinary course-material storage is not configured.",500);
  return {cloudName,apiKey,apiSecret};
}
function cloudinarySignature(params:Record<string,string>,secret:string) {
  const ordered=Object.keys(params).filter(key=>params[key]!==undefined&&params[key]!==null&&params[key]!=="")
    .sort().map(key=>key+"="+String(params[key])).join("&");
  return createHash("sha1").update(ordered+secret).digest("hex");
}
async function cloudinaryMaterial(publicId:string) {
  const config=cloudinaryConfig();
  const response=await fetch("https://api.cloudinary.com/v1_1/"+
    encodeURIComponent(config.cloudName)+"/resources/raw/authenticated/"+encodeURIComponent(publicId),{
      headers:{Accept:"application/json",Authorization:"Basic "+Buffer.from(config.apiKey+":"+config.apiSecret).toString("base64")},
      cache:"no-store"
    });
  if(response.status===404)throw new MaterialFileError("Course material file not found.",404);
  if(!response.ok)throw new MaterialFileError("Could not verify the Cloudinary course material.",502);
  const result=await response.json();
  if(result.public_id!==publicId||result.resource_type!=="raw"||result.type!=="authenticated"
    || !cloudinaryAssetId.test(String(result.asset_id||"")))
    throw new MaterialFileError("Course material file not found.",404);
  return {assetId:String(result.asset_id),config};
}
function cloudinaryUrl(assetId:string,kind:"attachment"|"inline",config:ReturnType<typeof cloudinaryConfig>) {
  const timestamp=Math.floor(Date.now()/1000);
  const params={
    asset_id:assetId,
    attachment:kind==="attachment"?"true":"false",
    expires_at:String(timestamp+5*60),
    timestamp:String(timestamp)
  };
  const query=new URLSearchParams({...params,api_key:config.apiKey,
    signature:cloudinarySignature(params,config.apiSecret)});
  return "https://api.cloudinary.com/v1_1/"+encodeURIComponent(config.cloudName)+"/asset/download?"+query.toString();
}
export async function materialSource(data:Record<string,unknown>):Promise<{
  url:string; inlineUrl?:string; provider:"imagekit"|"cloudinary";
}> {
  const key=String(data.storageKey||"");
  if(data.storageProvider==="imagekit"){
    const id=String(data.imagekitFileId||data.fileId||"");
    if(!imageKitId.test(id)||!imageKitPath.test(key))throw new MaterialFileError("Course material file not found.",404);
    const stored=await imageKitMaterial(id);
    if(stored.path!==key||!stored.private)throw new MaterialFileError("Course material file not found.",404);
    const {privateKey,endpoint}=imageKitConfig();
    const relative=key.replace(/^\//,"");
    const expiry=Math.floor(Date.now()/1000)+5*60;
    const signature=createHmac("sha1",privateKey).update(relative+expiry).digest("hex");
    return {url:endpoint+"/"+relative+"?ik-t="+expiry+"&ik-s="+signature,provider:"imagekit"};
  }
  if(!cloudinaryPublicId.test(key))throw new MaterialFileError("Course material file not found.",404);
  const {assetId,config}=await cloudinaryMaterial(key);
  return {url:cloudinaryUrl(assetId,"attachment",config),inlineUrl:cloudinaryUrl(assetId,"inline",config),provider:"cloudinary"};
}
export const allowedMime:Record<string,string>={
  pdf:"application/pdf",doc:"application/msword",
  docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt:"application/vnd.ms-powerpoint",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls:"application/vnd.ms-excel",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png"
};
export function safeFileName(input:unknown){
  return String(input||"course-material").split(/[\\/]/).pop()!.replace(/\s*\|\s*/g," ")
    .replace(/[\u0000-\u001f\u007f]/g,"").trim().slice(0,240)||"course-material";
}
export function maxMaterialBytes():number {
  const setting=Number(process.env.COURSE_MATERIAL_MAX_FILE_BYTES);
  return Number.isSafeInteger(setting)&&setting>0?Math.min(setting,100*1024*1024):25*1024*1024;
}


/** Delete an owned material after independently verifying the storage object identity. */
export async function deleteStoredCourseMaterial(material:Record<string,unknown>):Promise<void> {
  const source=await materialSource(material);
  const key=String(material.storageKey||"");
  if(source.provider==="imagekit"){
    const id=String(material.imagekitFileId||material.fileId||"");
    if(!imageKitId.test(id)||!imageKitPath.test(key))
      throw new MaterialFileError("Course material file not found.",404);
    const {privateKey}=imageKitConfig();
    const response=await fetch("https://api.imagekit.io/v1/files/"+id,{
      method:"DELETE",
      headers:{Authorization:"Basic "+Buffer.from(privateKey+":").toString("base64")},
      cache:"no-store"
    });
    if(!response.ok&&response.status!==404)throw new MaterialFileError("Could not delete course material.",502);
    return;
  }
  if(!cloudinaryPublicId.test(key))
    throw new MaterialFileError("Course material file not found.",404);
  const config=cloudinaryConfig();
  const params={
    invalidate:"true",public_id:key,timestamp:String(Math.floor(Date.now()/1000))
  };
  const body=new URLSearchParams({...params,api_key:config.apiKey,signature:cloudinarySignature(params,config.apiSecret)});
  const response=await fetch("https://api.cloudinary.com/v1_1/"+
    encodeURIComponent(config.cloudName)+"/raw/authenticated/destroy",{
      method:"POST", headers:{
        Accept:"application/json","Content-Type":"application/x-www-form-urlencoded"
      },body:body.toString(),cache:"no-store"
    });
  if(!response.ok)throw new MaterialFileError("Could not delete course material.",502);
  const result=await response.json().catch(()=>({}));
  if(result.result!=="ok"&&result.result!=="not found")
    throw new MaterialFileError("Could not delete course material.",502);
}
