'use strict';
(function(root){
  const originalHash='b85f5970ea619b7a6671a4de8cce430e2654a2e5bbef5e74ef35d4702dadb67b';
  const patchedHash='ffe2434e062483c7bd843532469ab154e693192879458c38d71f6397789459de';
  function normalizeRom(bytes){return bytes.length%1024===512?bytes.slice(512):bytes;}
  function applyIps(rom,patch){
    let pos=0;const take=n=>{if(pos+n>patch.length)throw Error('패치 파일이 잘렸습니다.');const start=pos;pos+=n;return patch.subarray(start,pos);};
    const number=n=>take(n).reduce((a,b)=>(a*256+b),0);
    if(new TextDecoder().decode(take(5))!=='PATCH')throw Error('IPS 패치 형식이 잘못됐습니다.');
    const output=new Uint8Array(4*1024*1024);if(rom.length>output.length)throw Error('ROM 크기가 잘못됐습니다.');output.set(rom);
    while(true){const offset=number(3);if(offset===0x454f46)break;const length=number(2);if(length){if(offset+length>output.length)throw Error('패치 범위를 벗어났습니다.');output.set(take(length),offset);}else{const count=number(2),value=number(1);if(!count||offset+count>output.length)throw Error('패치 범위를 벗어났습니다.');output.fill(value,offset,offset+count);}}
    if(pos===patch.length)return output;
    if(patch.length-pos!==3||number(3)!==output.length)throw Error('패치 최종 크기가 잘못됐습니다.');
    return output;
  }
  async function hash(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
  async function prepareRom(file,edition){
    if(!file)throw Error('먼저 원본 ROM 파일을 선택해 주세요.');
    if(file.size>5*1024*1024)throw Error('지원하는 원본 ROM 파일이 아닙니다.');
    let bytes=normalizeRom(new Uint8Array(await file.arrayBuffer()));
    if(await hash(bytes)!==originalHash)throw Error('지원하는 일본어 원본 ROM과 다릅니다. 원본 .sfc/.smc 파일을 선택해 주세요.');
    if(edition==='ko'){const response=await fetch('another-story-ko-draft.ips');if(!response.ok)throw Error('한글 패치를 불러오지 못했습니다.');bytes=applyIps(bytes,new Uint8Array(await response.arrayBuffer()));if(await hash(bytes)!==patchedHash)throw Error('한글 패치 검증에 실패했습니다. 페이지를 새로고침해 주세요.');}
    return URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'}));
  }
  root.prepareRom=prepareRom;
  if(typeof module!=='undefined')module.exports={applyIps,normalizeRom,hash,originalHash,patchedHash};
})(typeof window==='undefined'?globalThis:window);
