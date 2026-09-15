const  SUPABASE_URL="https://llnxlxocfzeqqkqocxsa.supabase.co";const  SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsbnhseG9jZnplcXFrcW9jeHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDA4NDMsImV4cCI6MjEwNDMxNjg0M30.i5gtm504ky0xNQaAkUrFZWEdChG57HpCvxoeFNvLsfg";let  supabaseClient=null,allSnippets=[],currentFilteredSnippets=[],isDemoMode=false,toastTimeoutId=null,lastFocusedElement=null;const  INITIAL_DEMO_SNIPPETS=[
{id:"demo-1",title:"Docker Postgres",category:"Commands",content:"services:\n  postgres:\n    image: postgres:16-alpine\n    ports:\n      - \"5432:5432\"",created_at:new  Date(Date.now()-900000).toISOString()},{id:"demo-2",title:"useDebounce Hook",category:"Programming",content:"import { useState, useEffect } from 'react';\nexport function useDebounce(value, delay = 300) {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const timer = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(timer);\n  }, [value, delay]);\n  return debounced;\n}",created_at:new  Date(Date.now()-7200000).toISOString()}];let  searchInput,clearSearchBtn,categoryFilter,copyAllBtn,openCreateBtn,emptyCreateBtn,retryBtn;let  snippetsGrid,loadingState,emptyState,errorState,resultsCount,activeFilterTag,demoBanner,dismissBannerBtn;let  createModal,closeModalBtn,cancelModalBtn,createSnippetForm,snippetTitle,snippetCategory,snippetContent;let  titleCharCount,contentCharCount,formError,saveSnippetBtn;let  downloadZipBtn,uploadZipBtn,uploadZipModal,closeZipModalBtn,cancelZipModalBtn,confirmZipImportBtn;let  zipDropzone,zipFileInput,zipFileInfo,zipFileName,zipFileSize,zipRemoveFileBtn,zipCategoryOption,zipError;let  zipPreviewSection,zipPreviewSummary,zipSelectAllCheckbox,zipPreviewList;let  zipModeFull,zipModeExtract,zipFullDetailsSection,zipFullTitle,zipFullSummary,zipFullFileList;let  toastActionBtn;let  quickLinkModal,closeQuickLinkModalBtn,cancelQuickLinkModalBtn,quickLinkInput,copyQuickLinkBtn,quickLinkModeCopy,quickLinkModeDownload,quickLinkToolbarBtn,quickLinkQrImg,quickLinkPasteInput,openPastedQuickLinkBtn;let  quickActionOverlay,closeQuickActionBtn,quickActionTitle,quickActionBadge,quickActionPreview,quickActionCopyBtn,quickActionDownloadBtn,quickActionOpenAppBtn;let  currentQuickLinkSnippet=null,currentQuickActionSnippet=null;let  toast,toastMessage;let  parsedZipSnippets=[],currentZipFile=null,currentZipBlob=null,currentZipFilesMeta=[];function makeEl(tag,cls,text,children){const  el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;if(children)children.forEach((c)=>c&&el.appendChild(c));return  el;}function makeBtn(cls,text,aria,handler){const  b=makeEl("button",cls,text);b.type="button";if(aria)b.setAttribute("aria-label",aria);if(handler)b.addEventListener("click",handler);return  b;}function setBtnState(btn,text,isTemp,orig){if(!btn)return;btn.textContent=text;if(isTemp){btn.classList.add("is-downloaded");setTimeout(()=>{btn.textContent=orig;btn.disabled=false;btn.classList.remove("is-downloaded");},2000);}}function saveDemoSnippets(){localStorage.setItem("quickcopy_demo_snippets",JSON.stringify(allSnippets));}document.addEventListener("DOMContentLoaded",async ()=>{initDOMElements();setupEventListeners();checkSupabaseConfiguration();await  loadSnippets();await  handleIncomingQuickLink();});function initDOMElements(){const  g=(id)=>document.getElementById(id);searchInput=g("searchInput");clearSearchBtn=g("clearSearchBtn");categoryFilter=g("categoryFilter");copyAllBtn=g("copyAllBtn");openCreateBtn=g("openCreateBtn");emptyCreateBtn=g("emptyCreateBtn");retryBtn=g("retryBtn");snippetsGrid=g("snippetsGrid");loadingState=g("loadingState");emptyState=g("emptyState");errorState=g("errorState");resultsCount=g("resultsCount");activeFilterTag=g("activeFilterTag");demoBanner=g("demoBanner");dismissBannerBtn=g("dismissBannerBtn");createModal=g("createModal");closeModalBtn=g("closeModalBtn");cancelModalBtn=g("cancelModalBtn");createSnippetForm=g("createSnippetForm");snippetTitle=g("snippetTitle");snippetCategory=g("snippetCategory");snippetContent=g("snippetContent");titleCharCount=g("titleCharCount");contentCharCount=g("contentCharCount");formError=g("formError");saveSnippetBtn=g("saveSnippetBtn");downloadZipBtn=g("downloadZipBtn");uploadZipBtn=g("uploadZipBtn");uploadZipModal=g("uploadZipModal");closeZipModalBtn=g("closeZipModalBtn");cancelZipModalBtn=g("cancelZipModalBtn");confirmZipImportBtn=g("confirmZipImportBtn");zipDropzone=g("zipDropzone");zipFileInput=g("zipFileInput");zipFileInfo=g("zipFileInfo");zipFileName=g("zipFileName");zipFileSize=g("zipFileSize");zipRemoveFileBtn=g("zipRemoveFileBtn");zipCategoryOption=g("zipCategoryOption");zipError=g("zipError");zipPreviewSection=g("zipPreviewSection");zipPreviewSummary=g("zipPreviewSummary");zipSelectAllCheckbox=g("zipSelectAllCheckbox");zipPreviewList=g("zipPreviewList");zipModeFull=g("zipModeFull");zipModeExtract=g("zipModeExtract");zipFullDetailsSection=g("zipFullDetailsSection");zipFullTitle=g("zipFullTitle");zipFullSummary=g("zipFullSummary");zipFullFileList=g("zipFullFileList");toast=g("toast");toastMessage=g("toastMessage");toastActionBtn=g("toastActionBtn");quickLinkModal=g("quickLinkModal");closeQuickLinkModalBtn=g("closeQuickLinkModalBtn");cancelQuickLinkModalBtn=g("cancelQuickLinkModalBtn");quickLinkInput=g("quickLinkInput");copyQuickLinkBtn=g("copyQuickLinkBtn");quickLinkModeCopy=g("quickLinkModeCopy");quickLinkModeDownload=g("quickLinkModeDownload");quickLinkToolbarBtn=g("quickLinkToolbarBtn");quickLinkQrImg=g("quickLinkQrImg");quickLinkPasteInput=g("quickLinkPasteInput");openPastedQuickLinkBtn=g("openPastedQuickLinkBtn");quickActionOverlay=g("quickActionOverlay");closeQuickActionBtn=g("closeQuickActionBtn");quickActionTitle=g("quickActionTitle");quickActionBadge=g("quickActionBadge");quickActionPreview=g("quickActionPreview");quickActionCopyBtn=g("quickActionCopyBtn");quickActionDownloadBtn=g("quickActionDownloadBtn");quickActionOpenAppBtn=g("quickActionOpenAppBtn");}function checkSupabaseConfiguration(){const  isBad=!SUPABASE_URL||SUPABASE_URL.includes("YOUR_")||!SUPABASE_URL.startsWith("http")||!SUPABASE_ANON_KEY||SUPABASE_ANON_KEY.length<20;isDemoMode=isBad;if(!isBad&&window.supabase&&typeof  window.supabase.createClient==="function"){try{supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);}catch{isDemoMode=true;}}else{isDemoMode=true;}if(demoBanner)demoBanner.classList.toggle("hidden",!isDemoMode);}function setupEventListeners(){const  on=(el,ev,fn)=>el&&el.addEventListener(ev,fn);on(searchInput,"input",()=>{clearSearchBtn.classList.toggle("hidden",searchInput.value.trim().length===0);filterSnippets();});on(clearSearchBtn,"click",()=>{searchInput.value="";clearSearchBtn.classList.add("hidden");searchInput.focus();filterSnippets();});on(categoryFilter,"change",filterSnippets);on(copyAllBtn,"click",copyAllSnippets);on(downloadZipBtn,"click",()=>{const  list=(currentFilteredSnippets&&currentFilteredSnippets.length>0)?currentFilteredSnippets:allSnippets;exportSnippetsToZip(list,undefined,downloadZipBtn);});on(uploadZipBtn,"click",openZipModal);[openCreateBtn,emptyCreateBtn].forEach((b)=>on(b,"click",openModal));[closeModalBtn,cancelModalBtn].forEach((b)=>on(b,"click",closeModal));[closeZipModalBtn,cancelZipModalBtn].forEach((b)=>on(b,"click",closeZipModal));on(createModal,"click",(e)=>{if(e.target===createModal)closeModal();});on(uploadZipModal,"click",(e)=>{if(e.target===uploadZipModal)closeZipModal();});if(zipDropzone){const  stopEv=(e)=>{e.preventDefault();e.stopPropagation();};on(zipDropzone,"click",(e)=>{if(e.target===zipFileInput)return;if(zipFileInput)zipFileInput.click();});on(zipDropzone,"keydown",(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();if(zipFileInput)zipFileInput.click();}});["dragenter","dragover"].forEach((ev)=>on(zipDropzone,ev,(e)=>{stopEv(e);zipDropzone.classList.add("drag-over");}));["dragleave","dragend"].forEach((ev)=>on(zipDropzone,ev,(e)=>{stopEv(e);zipDropzone.classList.remove("drag-over");}));on(zipDropzone,"drop",(e)=>{stopEv(e);zipDropzone.classList.remove("drag-over");const  files=e.dataTransfer?e.dataTransfer.files:null;if(files&&files.length>0)handleSelectedZipFile(files[0]);});}if(zipFileInput)on(zipFileInput,"click",(e)=>e.stopPropagation());on(zipFileInput,"change",()=>{if(zipFileInput.files&&zipFileInput.files.length>0)handleSelectedZipFile(zipFileInput.files[0]);});on(zipRemoveFileBtn,"click",resetZipModalState);on(zipCategoryOption,"change",applyZipCategoryOptionChange);on(zipSelectAllCheckbox,"change",()=>toggleSelectAllZipSnippets(zipSelectAllCheckbox.checked));on(zipModeFull,"change",updateZipModalModeUI);on(zipModeExtract,"change",updateZipModalModeUI);on(confirmZipImportBtn,"click",()=>{if(getZipUploadMode()==="full")saveFullZipSnippet();else  importSelectedZipSnippets();});[closeQuickLinkModalBtn,cancelQuickLinkModalBtn].forEach((b)=>on(b,"click",closeQuickLinkModal));on(quickLinkModal,"click",(e)=>{if(e.target===quickLinkModal)closeQuickLinkModal();});[closeQuickActionBtn,quickActionOpenAppBtn].forEach((b)=>on(b,"click",closeQuickActionOverlay));on(quickActionOverlay,"click",(e)=>{if(e.target===quickActionOverlay)closeQuickActionOverlay();});[quickLinkModeCopy,quickLinkModeDownload].forEach((r)=>on(r,"change",updateQuickLinkModalLink));on(copyQuickLinkBtn,"click",copyCurrentQuickLink);if(quickLinkToolbarBtn)on(quickLinkToolbarBtn,"click",()=>openQuickLinkModal(currentQuickLinkSnippet||allSnippets[0]||null));if(openPastedQuickLinkBtn)on(openPastedQuickLinkBtn,"click",handleOpenPastedQuickLink);if(quickLinkPasteInput)on(quickLinkPasteInput,"keydown",(e)=>{if(e.key==="Enter"){e.preventDefault();handleOpenPastedQuickLink();}});on(quickActionCopyBtn,"click",handleQuickActionCopy);on(quickActionDownloadBtn,"click",handleQuickActionDownload);document.addEventListener("keydown",(event)=>{const  isCreateOpen=createModal&&!createModal.classList.contains("hidden");const  isZipOpen=uploadZipModal&&!uploadZipModal.classList.contains("hidden");const  isLinkOpen=quickLinkModal&&!quickLinkModal.classList.contains("hidden");const  isActionOpen=quickActionOverlay&&!quickActionOverlay.classList.contains("hidden");if(!isCreateOpen&&!isZipOpen&&!isLinkOpen&&!isActionOpen)return;const  activeModal=isActionOpen?quickActionOverlay:(isLinkOpen?quickLinkModal:(isZipOpen?uploadZipModal:createModal));if(event.key==="Escape"){if(isActionOpen)closeQuickActionOverlay();else  if(isLinkOpen)closeQuickLinkModal();else  if(isZipOpen)closeZipModal();else  if(isCreateOpen)closeModal();return;}if(event.key==="Tab"){const  focusable=Array.from(
activeModal.querySelectorAll(
'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
)
).filter((el) => el.offsetParent !== null && window.getComputedStyle(el).visibility !== "hidden");if(focusable.length===0)return;const  firstEl=focusable[0],lastEl=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===firstEl){event.preventDefault();lastEl.focus();}else  if(!event.shiftKey&&document.activeElement===lastEl){event.preventDefault();firstEl.focus();}}});const  bindCount=(input,counter,max)=>{on(input,"input",()=>{const  len=input.value.length;counter.textContent=`${len} / ${max}`;counter.classList.toggle("is-limit",len>=max);hideFormError();});};bindCount(snippetTitle,titleCharCount,100);bindCount(snippetContent,contentCharCount,10000);on(createSnippetForm,"submit",(e)=>{e.preventDefault();createSnippet();});on(retryBtn,"click",loadSnippets);on(dismissBannerBtn,"click",()=>{if(demoBanner)demoBanner.classList.add("hidden");});}async function loadSnippets(){snippetsGrid.innerHTML="";emptyState.classList.add("hidden");errorState.classList.add("hidden");loadingState.classList.remove("hidden");if(isDemoMode){setTimeout(()=>{try{const  stored=localStorage.getItem("quickcopy_demo_snippets");allSnippets=(stored?JSON.parse(stored):[...INITIAL_DEMO_SNIPPETS]).map((s)=>{if(isFullZipSnippet(s))s.category="ZIP Archive";return  s;});if(!stored)saveDemoSnippets();allSnippets.sort((a,b)=>new Date(b.created_at) - new Date(a.created_at));loadingState.classList.add("hidden");filterSnippets();}catch{loadingState.classList.add("hidden");showErrorState("Unable to load snippets.\n\nPlease refresh the page and try again.");}},150);return;}try{const {data,error}=await  supabaseClient
.from("snippets")
.select("id, title, category, content, created_at")
.order("created_at", { ascending: false });loadingState.classList.add("hidden");if(error){showErrorState("Unable to load snippets.\n\nPlease refresh the page and try again.");return;}allSnippets=(data||[]).map((s)=>{if(isFullZipSnippet(s))s.category="ZIP Archive";return  s;});filterSnippets();}catch(err){loadingState.classList.add("hidden");showErrorState("Unable to load snippets.\n\nPlease refresh the page and try again.");}}function filterSnippets(){const  query=searchInput?searchInput.value.trim().toLowerCase():"";const  category=categoryFilter?categoryFilter.value:"All";currentFilteredSnippets=allSnippets.filter((snippet)=>{const  matchesCategory=category==="All"||(snippet.category&&snippet.category.toLowerCase()===category.toLowerCase());const  titleText=(snippet.title||"").toLowerCase();const  contentText=(snippet.content||"").toLowerCase();const  catText=(snippet.category||"").toLowerCase();return  matchesCategory&&(!query||titleText.includes(query)||contentText.includes(query)||catText.includes(query));});updateResultsMeta(query,category,currentFilteredSnippets.length,allSnippets.length);renderSnippets(currentFilteredSnippets);}function updateResultsMeta(query,category,count,total){if(!resultsCount)return;if(total===0){resultsCount.textContent="0 snippets";activeFilterTag.classList.add("hidden");return;}const  sLabel=count===1?"snippet":"snippets";resultsCount.textContent=`Showing ${count} of ${total} ${sLabel}`;const  tags=[];if(category&&category!=="All")tags.push(`Category: ${category}`);if(query)tags.push(`Search: "${query}"`);if(tags.length>0){activeFilterTag.textContent=tags.join(" • ");activeFilterTag.classList.remove("hidden");}else{activeFilterTag.classList.add("hidden");}}function renderSnippets(snippetsToDisplay=currentFilteredSnippets){snippetsGrid.innerHTML="";if(allSnippets.length===0){emptyState.classList.remove("hidden");snippetsGrid.classList.add("hidden");return;}emptyState.classList.add("hidden");snippetsGrid.classList.remove("hidden");if(snippetsToDisplay.length===0){const  clearBtn=makeEl("button","btn btn-secondary","Reset Filters");clearBtn.type="button";clearBtn.addEventListener("click",()=>{searchInput.value="";clearSearchBtn.classList.add("hidden");categoryFilter.value="All";filterSnippets();});const  noMatchBox=makeEl("div","state-box",undefined,[
makeEl("div","state-icon","🔍"),makeEl("h3","state-title","No matching snippets"),makeEl("p","state-desc","Try adjusting your search terms or category filter."),clearBtn
]);noMatchBox.style.gridColumn="1 / -1";noMatchBox.style.padding="3rem 1.5rem";snippetsGrid.appendChild(noMatchBox);return;}snippetsToDisplay.forEach((snippet)=>{snippetsGrid.appendChild(createSnippetCardElement(snippet));});}function openZipDB(){return  new  Promise((res)=>{if(typeof  indexedDB==="undefined")return  res(null);try{const  r=indexedDB.open("quickcopy_zip_db",1);r.onupgradeneeded=(e)=>{const  db=e.target.result;if(!db.objectStoreNames.contains("zip_files"))db.createObjectStore("zip_files");};r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);}catch{res(null);}});}async function saveZipBlobToDB(id,blob){if(!id||!blob)return  false;try{const  db=await  openZipDB();if(!db)return  false;return  new  Promise((res)=>{const  tx=db.transaction("zip_files","readwrite");tx.objectStore("zip_files").put(blob,String(id));tx.oncomplete=()=>res(true);tx.onerror=()=>res(false);});}catch{return  false;}}async function getZipBlobFromDB(id){if(!id)return  null;try{const  db=await  openZipDB();if(!db)return  null;return  new  Promise((res)=>{const  req=db.transaction("zip_files","readonly").objectStore("zip_files").get(String(id));req.onsuccess=()=>res(req.result||null);req.onerror=()=>res(null);});}catch{return  null;}}function readFileAsBase64(blobOrFile){return  new  Promise((res)=>{if(typeof  FileReader==="undefined")return  res("");const  r=new  FileReader();r.onload=()=>{const  s=r.result;if(typeof  s==="string"){const  i=s.indexOf(",");res(i>=0?s.slice(i+1):s);}else  res("");};r.onerror=()=>res("");r.readAsDataURL(blobOrFile);});}function base64ToBlob(b64,mime="application/zip"){const  c=atob(b64),b=new  Uint8Array(c.length);for(let  i=0;i<c.length;i++)b[i]=c.charCodeAt(i);return  new  Blob([b],{type:mime});}function isFullZipSnippet(snippet){if(!snippet||!snippet.content)return  false;const  c=snippet.content.trim();return(
c.startsWith('{"__quickcopy_zip__":true')||
c.startsWith('{"__quickcopy_zip__": true')||
(snippet.category==="ZIP Archive"&&c.includes('"__quickcopy_zip__"'))
);}function parseZipDescriptor(snippet){if(!snippet||!snippet.content)return  null;try{const  obj=JSON.parse(snippet.content);if(obj&&obj.__quickcopy_zip__)return  obj;}catch{}return  null;}function createFullZipCardElement(snippet){const  descriptor=parseZipDescriptor(snippet)||{};const  fileCount=descriptor.fileCount||(descriptor.files?descriptor.files.length:0);const  fileSize=descriptor.fileSize||0;const  files=descriptor.files||[];const  timeSpan=makeEl("time","snippet-time",formatTimestamp(snippet.created_at));if(snippet.created_at)timeSpan.setAttribute("datetime",snippet.created_at);const  header=makeEl("div","snippet-card-header",undefined,[
makeEl("div","snippet-title-row",undefined,[makeEl("h2","snippet-title",snippet.title||descriptor.fileName||"archive.zip")]),makeEl("div","snippet-meta-row",undefined,[
makeEl("span","category-badge badge-ziparchive",snippet.category||"ZIP Archive"),timeSpan
])
]);const  fileList=makeEl("div","zip-card-filelist");if(files.length===0){fileList.appendChild(makeEl("div","zip-card-file-item",undefined,[makeEl("span","zip-card-file-name",descriptor.fileName||"Archive contents intact")]));}else{files.forEach((f)=>{fileList.appendChild(makeEl("div","zip-card-file-item",undefined,[
makeEl("span","zip-card-file-name",f.name),makeEl("span","zip-card-file-size",formatBytes(f.size))
]));});}const  body=makeEl("div","snippet-card-body",undefined,[
makeEl("div","zip-card-overview",`📦 ZIP Archive • ${fileCount} file${fileCount === 1 ? "" : "s"} • ${formatBytes(fileSize)}`),fileList
]);const  copyInfoBtn=makeBtn("btn-copy","📋 Copy Info",`Copy archive details for "${snippet.title}"`,()=>{copySnippet([
`Title: ${snippet.title}`,`Category: ${snippet.category || "ZIP Archive"}`,`Files: ${fileCount} | Size: ${formatBytes(fileSize)}`,"Files inside archive:",...files.map((f)=>`- ${f.name} (${formatBytes(f.size)})`)
].join("\n"),copyInfoBtn);});const  extractBtn=makeBtn("btn-copy btn-card-extract","📂 Extract & Split",`Extract all files from ZIP "${snippet.title}" into individual snippet cards`,()=>extractAndSplitZipSnippet(snippet,extractBtn));const  downloadBtn=makeBtn("btn-copy btn-card-zip-primary","📥 Download ZIP",`Download intact ZIP file "${snippet.title}"`,()=>downloadFullZipSnippet(snippet,downloadBtn));const  linkBtn=makeBtn("btn-copy btn-card-link","🔗 Link",`Get QuickLink for "${snippet.title}"`,()=>openQuickLinkModal(snippet,"download"));const  footer=makeEl("div","snippet-card-footer",undefined,[linkBtn,copyInfoBtn,extractBtn,downloadBtn]);const  card=makeEl("article","snippet-card snippet-card-zip",undefined,[header,body,footer]);card.setAttribute("data-id",snippet.id||"");return  card;}function createSnippetCardElement(snippet){if(isFullZipSnippet(snippet)){return  createFullZipCardElement(snippet);}const  card=makeEl("article","snippet-card");card.setAttribute("data-id",snippet.id||"");const  titleRow=makeEl("div","snippet-title-row");const  title=makeEl("h2","snippet-title");title.textContent = snippet.title || "Untitled Snippet";
titleRow.appendChild(title);const  cat=snippet.category||"General";const  catSlug=cat.toLowerCase().replace(/[^a-z0-9]/g,"");const  categoryBadge=makeEl("span",`category-badge badge-${catSlug}`);categoryBadge.textContent = cat;
const  timeSpan=makeEl("time","snippet-time",formatTimestamp(snippet.created_at));if(snippet.created_at)timeSpan.setAttribute("datetime",snippet.created_at);const  metaRow=makeEl("div","snippet-meta-row",undefined,[categoryBadge,timeSpan]);const  header=makeEl("div","snippet-card-header",undefined,[titleRow,metaRow]);const  pre=makeEl("pre","snippet-content");pre.textContent = snippet.content || "";
const  contentWrapper=makeEl("div","snippet-content-wrapper",undefined,[pre]);const  body=makeEl("div","snippet-card-body",undefined,[contentWrapper]);const  rawContent=snippet.content||"";const  lineCount=(rawContent.match(/\n/g)||[]).length+1;const  isLong=lineCount>6||rawContent.length>300;if(isLong){contentWrapper.classList.add("is-truncated");const  expandBtn=makeEl("button","snippet-expand-btn","Show more ▼");expandBtn.type="button";expandBtn.setAttribute("aria-expanded","false");expandBtn.addEventListener("click",()=>{const  isTruncated=contentWrapper.classList.toggle("is-truncated");expandBtn.textContent=isTruncated?"Show more ▼":"Show less ▲";expandBtn.setAttribute("aria-expanded",isTruncated?"false":"true");});body.appendChild(expandBtn);}const  zipBtn=makeBtn("btn-copy btn-card-zip","📦 ZIP",`Download snippet "${snippet.title}" as ZIP`,()=>{downloadSingleSnippetZip(snippet, zipBtn);});const  copyBtn=makeBtn("btn-copy","📋 COPY",`Copy snippet "${snippet.title}"`,()=>{copySnippet(snippet.content||"",copyBtn);});const  linkBtn=makeBtn("btn-copy btn-card-link","🔗 Link",`Get QuickLink for "${snippet.title}"`,()=>openQuickLinkModal(snippet,"copy"));const  footer=makeEl("div","snippet-card-footer",undefined,[linkBtn,zipBtn,copyBtn]);card.appendChild(header);card.appendChild(body);card.appendChild(footer);return  card;}async function createSnippet(){hideFormError();const  title=(snippetTitle.value||"").trim();if(!title){displayFormError("Title is required.");snippetTitle.focus();return;}if(title.length>100){displayFormError("Title must be 100 characters or fewer.");snippetTitle.focus();return;}const  rawContent=snippetContent.value||"";if(!rawContent.trim()){displayFormError("Content is required.");snippetContent.focus();return;}if(rawContent.length>10000){displayFormError("Content must be 10,000 characters or fewer.");snippetContent.focus();return;}const  content=rawContent.trimEnd();const  category=snippetCategory.value||"General";setSavingState(true);if(isDemoMode){setTimeout(()=>{try{const  newSnippet={id:`demo-${Date.now()}`,title,category,content,created_at:new  Date().toISOString()};allSnippets.unshift(newSnippet);saveDemoSnippets();setSavingState(false);closeModal();filterSnippets();showToast("Snippet saved!");}catch{setSavingState(false);displayFormError("Could not save your snippet.\nPlease try again.");}},200);return;}try{const {data,error}=await  supabaseClient
.from("snippets")
.insert([{title,category:toDbCategory(category),content}])
.select();if(error){setSavingState(false);displayFormError("Could not save your snippet.\nPlease try again.");return;}const  insertedSnippet=(data&&data[0])||{id:`supa-${Date.now()}`,title,category,content,created_at:new  Date().toISOString()};if(isFullZipSnippet(insertedSnippet))insertedSnippet.category="ZIP Archive";allSnippets.unshift(insertedSnippet);setSavingState(false);closeModal();filterSnippets();showToast("Snippet saved!");}catch(err){setSavingState(false);displayFormError("Could not save your snippet.\nPlease try again.");}}function copySnippet(text,buttonElement,customToast="Copied to clipboard!"){if(!buttonElement)return;const  doSuccessFeedback=()=>{const  originalText=buttonElement.textContent;buttonElement.textContent = "✓ COPIED";
buttonElement.classList.add("is-copied");
setTimeout(()=>{buttonElement.textContent=originalText;buttonElement.classList.remove("is-copied");},2000);showToast(customToast);};const  doFailureFeedback=()=>{showToast("Could not copy snippet to clipboard.");};if(navigator.clipboard&&typeof  navigator.clipboard.writeText==="function"){navigator.clipboard.writeText(text)
.then(doSuccessFeedback)
.catch(()=>fallbackExecCommandCopy(text,doSuccessFeedback,doFailureFeedback));}else{fallbackExecCommandCopy(text,doSuccessFeedback,doFailureFeedback);}}function fallbackExecCommandCopy(text,onSuccess,onFailure){const  textArea=document.createElement("textarea");textArea.value=text;textArea.style.position="fixed";textArea.style.top="-9999px";textArea.style.left="-9999px";textArea.style.opacity="0";textArea.setAttribute("readonly","");document.body.appendChild(textArea);textArea.focus();textArea.select();if(textArea.setSelectionRange)if(textArea.setSelectionRange)if(textArea.setSelectionRange)textArea.setSelectionRange(0,textArea.value.length);try{const  successful=document.execCommand("copy");document.body.removeChild(textArea);if(successful){if(typeof  onSuccess==="function")onSuccess();}else{if(typeof  onFailure==="function")onFailure();}}catch{document.body.removeChild(textArea);if(typeof  onFailure==="function")onFailure();}}function copyAllSnippets(){const  snippetsToCopy=(currentFilteredSnippets&&currentFilteredSnippets.length>0)
?currentFilteredSnippets
:allSnippets;if(!snippetsToCopy||snippetsToCopy.length===0){showToast("No snippets to copy.");return;}const  formattedAll=snippetsToCopy
.map((s)=>`${s.title || "Untitled"}\n\n${s.content || ""}`)
.join("\n\n\n");const  originalHtml=copyAllBtn.innerHTML;copySnippet(formattedAll,copyAllBtn,`Copied ${snippetsToCopy.length} snippet${snippetsToCopy.length === 1 ? "" : "s"}!`);const  onSuccessCallback=()=>{copyAllBtn.innerHTML='<span class="btn-icon">✓</span> COPIED ALL';copyAllBtn.classList.add("is-copied");setTimeout(()=>{copyAllBtn.innerHTML=originalHtml;copyAllBtn.classList.remove("is-copied");},2000);};onSuccessCallback();}function openModal(){lastFocusedElement=document.activeElement;createSnippetForm.reset();titleCharCount.textContent="0 / 100";titleCharCount.classList.remove("is-limit");contentCharCount.textContent="0 / 10000";contentCharCount.classList.remove("is-limit");hideFormError();createModal.classList.remove("hidden");document.body.style.overflow="hidden";setTimeout(()=>snippetTitle.focus(),50);}function closeModal(){createModal.classList.add("hidden");document.body.style.overflow="";hideFormError();if(lastFocusedElement&&typeof  lastFocusedElement.focus==="function")lastFocusedElement.focus();}function showToast(message,actionText,onAction){if(!toast)toast=document.getElementById("toast");if(!toastMessage)toastMessage=document.getElementById("toastMessage");if(!toastActionBtn)toastActionBtn=document.getElementById("toastActionBtn");if(!toast||!toastMessage)return;if(toastTimeoutId){clearTimeout(toastTimeoutId);toastTimeoutId=null;}toastMessage.textContent = message;
if(toastActionBtn){if(actionText&&typeof  onAction==="function"){toastActionBtn.textContent=actionText;toastActionBtn.classList.remove("hidden");toastActionBtn.onclick=(e)=>{if(e&&typeof  e.stopPropagation==="function")e.stopPropagation();onAction();};}else{toastActionBtn.classList.add("hidden");toastActionBtn.onclick=null;toastActionBtn.textContent="";}}toast.classList.remove("hidden");toastTimeoutId=setTimeout(()=>{toast.classList.add("hidden");if(toastActionBtn){toastActionBtn.classList.add("hidden");toastActionBtn.onclick=null;toastActionBtn.textContent="";}toastTimeoutId=null;},3500);}function displayFormError(msg){formError.textContent = msg;
formError.classList.remove("hidden");}function hideFormError(){formError.textContent="";formError.classList.add("hidden");}function setSavingState(isSaving){saveSnippetBtn.disabled=isSaving;const  btnText=saveSnippetBtn.querySelector(".btn-text");if(btnText)btnText.textContent=isSaving?"Saving...":"Save Snippet";}function showErrorState(message){loadingState.classList.add("hidden");emptyState.classList.add("hidden");snippetsGrid.innerHTML="";const  titleEl=errorState.querySelector(".state-title");const  descEl=errorState.querySelector(".state-desc");const  parts=message.split("\n\n");if(parts.length>=2){titleEl.textContent = parts[0];
descEl.textContent = parts[1];}else{titleEl.textContent=message;descEl.textContent="Please check your network connection and try again.";}errorState.classList.remove("hidden");}function formatTimestamp(isoString){if(!isoString)return  "";const  date=new  Date(isoString);if(isNaN(date.getTime()))return  "";const  diffSec=Math.floor((Date.now()-date)/1000);if(diffSec<60)return  "Just now";if(diffSec<3600)return  `${Math.floor(diffSec / 60)}m ago`;if(diffSec<86400)return  `${Math.floor(diffSec / 3600)}h ago`;if(diffSec<604800)return  `${Math.floor(diffSec / 86400)}d ago`;return  date.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});}function sanitizeFilename(name){if(!name||typeof  name!=="string")return  "snippet";let  cleaned=name
.replace(/[<>:"/\\|?*\x00-\x1F]/g,"_")
.replace(/\s+/g," ")
.trim()
.replace(/_+/g,"_")
.replace(/^[_.\s]+|[_.\s]+$/g,"");
if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i.test(cleaned))cleaned=`_${cleaned}`;
return  cleaned.slice(0,60).trim()||"snippet";
}
function getSnippetExtension(category,content){const  cat=(category||"").toLowerCase();
const  text=(content||"").trim();
if(cat==="programming"){if(/^\s*def\s+[a-zA-Z_]|import\s+[a-zA-Z_]|elif\s+|if\s+__name__\s*==/m.test(text))return  "py";
if(/^\s*<!DOCTYPE\s+html|<html|<body|<div|<head/i.test(text))return  "html";
if(/[{;][\s\n]*[a-zA-Z-]+:\s*[^;]+;/m.test(text)&&!text.includes("function")&&!text.includes("const "))return  "css";
if(/^\s*(SELECT|INSERT\s+INTO|CREATE\s+TABLE|UPDATE|DELETE\s+FROM|ALTER\s+TABLE)\s+/i.test(text))return  "sql";
if((text.startsWith("{")&&text.endsWith("}"))||(text.startsWith("[")&&text.endsWith("]"))){try{JSON.parse(text);return  "json";}catch{}
}
if(/\b(interface|type|enum)\s+[A-Z]|\b:\s*(string|number|boolean|any)\b/.test(text))return  "ts";
return  "js";
}
if(cat==="commands"){if(/^\s*(SELECT|INSERT|CREATE|UPDATE|DELETE)\s+/i.test(text))return  "sql";
if(/^\s*(Get-|Set-|New-|Remove-|Start-|Stop-|\$[a-zA-Z_])/m.test(text)||text.includes("powershell"))return  "ps1";
if(/^@echo\b|^rem\b/im.test(text))return  "bat";
return  "sh";
}
if(cat==="notes"||cat==="thesis"||cat==="assignment"){if(/^#{1,6}\s+|^\s*[-*+]\s+|```|\*\*[\w\s]+\*\*/m.test(text))return  "md";
return  "txt";
}
return  "txt";
}
function triggerBlobDownload(blob,filename){const  url=URL.createObjectURL(blob);
const  a=document.createElement("a");
a.style.display="none";
a.href=url;
a.download=filename;
document.body.appendChild(a);
a.click();
setTimeout(()=>{document.body.removeChild(a);
URL.revokeObjectURL(url);
},150);
}
async function exportSnippetsToZip(snippetsList,archiveFilename,buttonElement){if(!snippetsList||snippetsList.length===0)return  showToast("No snippets to export.");
if(typeof  JSZip==="undefined")return  showToast("ZIP library not loaded. Please check your connection.");
const  orig=buttonElement?buttonElement.innerHTML:"";
if(buttonElement){buttonElement.disabled=true;
buttonElement.innerHTML='<span class="btn-icon">⏳</span> Generating...';
}
try{const  zip=new  JSZip(),used=new  Set();
snippetsList.forEach((s)=>{const  cat=s.category||"General";
const  ext=getSnippetExtension(cat,s.content||"");
const  base=sanitizeFilename(s.title||"snippet");
let  p=`snippets/${cat}/${base}.${ext}`,c=1;
while(used.has(p))p=`snippets/${cat}/${base}_${c++}.${ext}`;
used.add(p);
zip.file(p,s.content||"");
});
zip.file("quickcopy-backup.json",JSON.stringify(snippetsList.map((s)=>({id:s.id||"",title:s.title||"Untitled Snippet",category:s.category||"General",content:s.content||"",created_at:s.created_at||new  Date().toISOString()
})),null,2));
zip.file("README.txt",`QuickCopy Archive\nExported: ${new Date().toISOString()}\nSnippets: ${snippetsList.length}\nImport back via QuickCopy.`);
const  blob=await  zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});
triggerBlobDownload(blob,archiveFilename||`quickcopy-backup-${new Date().toISOString().slice(0, 10)}.zip`);
if(buttonElement){buttonElement.innerHTML='<span class="btn-icon">✓</span> Downloaded';
buttonElement.classList.add("is-copied");
setTimeout(()=>{buttonElement.innerHTML=orig;
buttonElement.disabled=false;
buttonElement.classList.remove("is-copied");
},2000);
}
showToast(`Exported ${snippetsList.length} snippet${snippetsList.length === 1 ? "" : "s"} to ZIP!`);
}catch(err){
if(buttonElement){buttonElement.innerHTML=orig;
buttonElement.disabled=false;
}
showToast("Failed to generate ZIP export.");
}
}
async function downloadSingleSnippetZip(snippet,buttonElement){if(!snippet)return;
if(isFullZipSnippet(snippet))return  downloadFullZipSnippet(snippet,buttonElement);
if(typeof  JSZip==="undefined")return  showToast("ZIP library not loaded. Please check your connection.");
const  orig=buttonElement?buttonElement.textContent:"";
if(buttonElement){buttonElement.disabled=true;buttonElement.textContent="⏳ ZIP";}
try{const  zip=new  JSZip();
const  cat=snippet.category||"General";
const  ext=getSnippetExtension(cat,snippet.content||"");
const  safeTitle=sanitizeFilename(snippet.title||"snippet");
let  codeFileName=`${safeTitle}.${ext}`;
if(/^(snippet\.json|readme\.txt)$/i.test(codeFileName))codeFileName=`${safeTitle}_code.${ext}`;
zip.file(codeFileName,snippet.content||"");
const  blob=await  zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});
triggerBlobDownload(blob,`quickcopy-${safeTitle}.zip`);
setBtnState(buttonElement,"✓ ZIP",true,orig);
showToast("Downloaded snippet ZIP!");
}catch(err){
if(buttonElement){buttonElement.textContent=orig;buttonElement.disabled=false;}
showToast("Failed to download snippet ZIP.");
}
}
async function downloadFullZipSnippet(snippet,buttonElement){if(!snippet)return;
const  descriptor=parseZipDescriptor(snippet)||{};
const  orig=buttonElement?buttonElement.textContent:"";
if(buttonElement){buttonElement.disabled=true;buttonElement.textContent="⏳ Downloading...";}
try{let  zipBlob=await  getZipBlobFromDB(snippet.id);
if(!zipBlob&&descriptor.base64)zipBlob=base64ToBlob(descriptor.base64,"application/zip");
if(!zipBlob&&currentZipBlob)zipBlob=currentZipBlob;
const  filesWithContent=(descriptor.files||[]).filter((f)=>f&&typeof  f.content==="string"&&f.content.length>0);
if(!zipBlob&&filesWithContent.length>0&&typeof  JSZip!=="undefined"){const  zip=new  JSZip();
filesWithContent.forEach((f)=>zip.file(f.name,f.content));
zipBlob=await  zip.generateAsync({type:"blob",compression:"DEFLATE"});
}
if(!zipBlob){showToast("Archive binary was cached locally on the uploading device and is not in cloud storage.");
if(buttonElement){buttonElement.textContent=orig;buttonElement.disabled=false;}
return;
}
const  filename=descriptor.fileName||(snippet.title.endsWith(".zip")?snippet.title:`${snippet.title}.zip`);
triggerBlobDownload(zipBlob,filename);
setBtnState(buttonElement,"✓ Downloaded",true,orig);
showToast("Downloaded full ZIP file!");
}catch(err){
if(buttonElement){buttonElement.textContent=orig;buttonElement.disabled=false;}
showToast("Failed to download ZIP file.");
}
}
async function extractAndSplitZipSnippet(snippet,buttonElement){if(!snippet)return;
if(typeof  JSZip==="undefined")return  showToast("JSZip library not loaded. Please refresh.");
const  orig=buttonElement?buttonElement.textContent:"";
if(buttonElement){buttonElement.disabled=true;buttonElement.textContent="⏳ Extracting...";}
try{const  descriptor=parseZipDescriptor(snippet)||{};
let  zipBlob=(await  getZipBlobFromDB(snippet.id))||(descriptor.base64?base64ToBlob(descriptor.base64):currentZipBlob);
if(!zipBlob){showToast("Cannot extract:ZIP data is not cached on this device.");
if(buttonElement){buttonElement.textContent=orig;buttonElement.disabled=false;}
return;
}
const  zip=await  JSZip.loadAsync(zipBlob);
const  extracted=await  extractTextSnippetsFromZip(zip);
if(extracted.length===0){showToast("No valid text files found inside this archive.");
if(buttonElement){buttonElement.textContent=orig;buttonElement.disabled=false;}
return;
}
const  now=Date.now();
if(isDemoMode){const  items=extracted.map((s,idx)=>({id:`demo-${now}-${idx}`,
title:s.title,
category:s.category,
content:s.content,
created_at:new  Date(now-idx*1000).toISOString()
}));
allSnippets.unshift(...items);
saveDemoSnippets();
}else{const  payload=extracted.map((s)=>({title:s.title,category:toDbCategory(s.category),content:s.content}));
const {data}=await  supabaseClient.from("snippets").insert(payload).select();
if(data&&data.length>0){allSnippets.unshift(...data.map((s)=>{if(isFullZipSnippet(s))s.category="ZIP Archive";return  s;}));
}else{allSnippets.unshift(...extracted.map((s,idx)=>({id:`ext-${now}-${idx}`,title:s.title,category:s.category,content:s.content,created_at:new  Date().toISOString()})));
}
}
filterSnippets();
setBtnState(buttonElement,"✓ Extracted",true,orig);
showToast(`Extracted ${extracted.length} snippets from ZIP archive!`);
}catch(err){
if(buttonElement){buttonElement.textContent=orig;buttonElement.disabled=false;}
showToast("Failed to extract snippets.");
}
}
function formatBytes(bytes){if(!bytes||bytes===0)return  "0 B";
const  k=1024,sizes=["B","KB","MB","GB"],i=Math.floor(Math.log(bytes)/ Math.log(k));
return  parseFloat((bytes / Math.pow(k,i)).toFixed(1))+" "+sizes[i];
}
function openZipModal(){lastFocusedElement=document.activeElement;
resetZipModalState();
uploadZipModal.classList.remove("hidden");
document.body.style.overflow="hidden";
setTimeout(()=>zipDropzone.focus(),50);
}
function closeZipModal(){uploadZipModal.classList.add("hidden");
document.body.style.overflow="";
resetZipModalState();
if(lastFocusedElement&&typeof  lastFocusedElement.focus==="function")lastFocusedElement.focus();
}
function resetZipModalState(){parsedZipSnippets=[];currentZipFile=currentZipBlob=null;currentZipFilesMeta=[];
if(zipFileInput)zipFileInput.value="";
if(zipModeFull)zipModeFull.checked=true;
if(zipModeExtract)zipModeExtract.checked=false;
if(zipCategoryOption)zipCategoryOption.value="ZIP Archive";
[zipFileInfo,zipFullDetailsSection,zipPreviewSection].forEach((el)=>el&&el.classList.add("hidden"));
if(zipFileName)zipFileName.textContent="";
if(zipFileSize)zipFileSize.textContent="";
if(zipFullTitle)zipFullTitle.value="";
if(zipFullSummary)zipFullSummary.textContent="";
if(zipFullFileList)zipFullFileList.innerHTML="";
if(zipPreviewList)zipPreviewList.innerHTML="";
if(zipPreviewSummary)zipPreviewSummary.textContent="Found 0 snippets";
if(zipSelectAllCheckbox)zipSelectAllCheckbox.checked=true;
if(confirmZipImportBtn){confirmZipImportBtn.disabled=true;
const  btnText=confirmZipImportBtn.querySelector(".btn-text");
if(btnText)btnText.textContent="Save Full ZIP File";
}
hideZipError();
}
function displayZipError(msg){if(zipFileInput)zipFileInput.value="";
if(!zipError)return;
zipError.textContent=msg;
zipError.classList.remove("hidden");
}
function hideZipError(){if(!zipError)return;
zipError.textContent="";
zipError.classList.add("hidden");
}
function setImportingState(isImporting){if(!confirmZipImportBtn)return;
confirmZipImportBtn.disabled=isImporting;
const  btnText=confirmZipImportBtn.querySelector(".btn-text");
if(btnText)btnText.textContent=isImporting?"Importing...":"Import Snippets";
}
function toDbCategory(cat){const  valid=["General","Programming","Thesis","Assignment","Commands","Notes","Links","Other"];
return  valid.includes(cat)?cat:"Other";
}
function normalizeCategory(cat){const  valid=["General","Programming","Thesis","Assignment","Commands","Notes","Links","Other","ZIP Archive"];
if(!cat||typeof  cat!=="string")return  "General";
return  valid.find((c)=>c.toLowerCase()===cat.trim().toLowerCase())||"General";
}
async function handleSelectedZipFile(file){hideZipError();
if(!file)return;
if(!file.name||!file.name.toLowerCase().endsWith(".zip"))return  displayZipError("Please select a valid .zip file archive.");
const  MAX_ZIP_FILE_SIZE=1024*1024*1024;
if(file.size>MAX_ZIP_FILE_SIZE)return  displayZipError("File exceeds the 1GB size limit. Please choose a smaller ZIP archive.");
zipFileName.textContent=file.name;
zipFileSize.textContent=`(${formatBytes(file.size)})`;
zipFileInfo.classList.remove("hidden");
if(typeof  JSZip==="undefined"){return  displayZipError("JSZip library is not loaded. Please refresh and check your internet connection.");
}
try{const  zip=await  JSZip.loadAsync(file);
for(const  p of  Object.keys(zip.files)){if(p.includes("../")||p.includes("..\\")){return  displayZipError("Security alert: The archive contains unsafe relative path references (path traversal attempt).");
}
}
currentZipFile=currentZipBlob=file;currentZipFilesMeta=[];
for(const [entryPath,entry]of  Object.entries(zip.files)){if(entry.dir)continue;
const  normalized=entryPath.replace(/\\/g,"/");
const  segments=normalized.split("/");
if(segments.some((seg)=>seg==="__MACOSX"||seg===".DS_Store"))continue;
currentZipFilesMeta.push({name:normalized,size:entry._data?(entry._data.uncompressedSize||0):0});
}
if(zipFullTitle)zipFullTitle.value=file.name.slice(0,100);
if(zipFullSummary)zipFullSummary.textContent=`📦 ${currentZipFilesMeta.length} file${currentZipFilesMeta.length === 1 ? "" : "s"} inside • ${formatBytes(file.size)}`;
if(zipFullFileList){zipFullFileList.innerHTML="";
currentZipFilesMeta.forEach((item)=>{zipFullFileList.appendChild(makeEl("div","zip-card-file-item",undefined,[
makeEl("span","zip-card-file-name",item.name),
makeEl("span","zip-card-file-size",formatBytes(item.size))
]));
});
}
parsedZipSnippets=await  extractTextSnippetsFromZip(zip);
if(parsedZipSnippets.length===0)return  displayZipError("No valid text or code snippets found in this ZIP archive.");
const  forcedCategory=zipCategoryOption?zipCategoryOption.value:"ZIP Archive";
if(forcedCategory!=="auto"&&forcedCategory!=="ZIP Archive"){parsedZipSnippets.forEach((s)=>(s.category=forcedCategory));
}
renderZipPreview();
updateZipModalModeUI();
}catch(err){
displayZipError("Failed to extract ZIP archive. Please ensure it is a valid, uncorrupted ZIP file.");
}
}
async function extractTextSnippetsFromZip(zip){const  snippets=[];
const  MAX_LIMIT=250;
const  MAX_EXTRACT_ENTRY_SIZE=100*1024*1024;
const  backupKey=Object.keys(zip.files).find((k)=>{const  name=k.toLowerCase().replace(/\\/g,"/").split("/").pop();
return  name==="quickcopy-backup.json"||name==="snippets.json"||name==="snippet.json";
});
if(backupKey&&!zip.files[backupKey].dir){try{const  backupEntry=zip.files[backupKey];
const  backupSize=(backupEntry._data&&typeof  backupEntry._data.uncompressedSize==="number")
?backupEntry._data.uncompressedSize
:(typeof  backupEntry.uncompressedSize==="number"?backupEntry.uncompressedSize:0);
if(backupSize<=MAX_EXTRACT_ENTRY_SIZE){const  parsed=JSON.parse(await  backupEntry.async ("string"));
const  items=Array.isArray(parsed)?parsed:[parsed];
for(const  item of  items){if(snippets.length>=MAX_LIMIT)break;
if(!item||typeof  item!=="object")continue;
const  rawTitle=typeof  item.title==="string"?item.title.trim():"";
const  title=rawTitle.slice(0,100)||"Imported Snippet";
const  rawContent=typeof  item.content==="string"?item.content:"";
if(!rawContent.trim())continue;
const  origCategory=normalizeCategory(item.category);
snippets.push({title,category:origCategory,originalCategory:origCategory,content:rawContent.slice(0,10000),checked:true});
}
}
}catch(e){
}
}
if(snippets.length===0){const  binaryExts=new  Set("png,jpg,jpeg,gif,bmp,ico,webp,tiff,psd,exe,dll,so,dylib,bin,iso,img,dmg,zip,tar,gz,7z,rar,bz2,xz,pdf,doc,docx,xls,xlsx,ppt,pptx,mp3,wav,flac,aac,ogg,mp4,mkv,avi,mov,wmv,ttf,otf,woff,woff2,eot,class,jar,pyc,pyo,o,obj".split(","));
const  validCats=["General","Programming","Thesis","Assignment","Commands","Notes","Links","Other"];
for(const [entryPath,entry]of  Object.entries(zip.files)){if(snippets.length>=MAX_LIMIT)break;
if(entry.dir)continue;
const  segments=entryPath.replace(/\\/g,"/").split("/");
const  fileName=segments[segments.length-1];
if(segments.some((seg)=>seg==="__MACOSX"||seg===".DS_Store"||seg===".git"||seg.startsWith(".")))continue;
if(!fileName||fileName.startsWith("."))continue;
const  lowerName=fileName.toLowerCase();
if(["readme.txt","snippet.json","snippets.json","quickcopy-backup.json"].includes(lowerName))continue;
const  dotIdx=fileName.lastIndexOf(".");
const  ext=dotIdx>=0?fileName.slice(dotIdx+1).toLowerCase():"";
if(binaryExts.has(ext))continue;
const  entrySize=(entry._data&&typeof  entry._data.uncompressedSize==="number")
?entry._data.uncompressedSize
:(typeof  entry.uncompressedSize==="number"?entry.uncompressedSize:0);
if(entrySize>MAX_EXTRACT_ENTRY_SIZE)continue;
let  text="";
try{text=await  entry.async ("string");}catch{continue;}
if(!text||!text.trim()||text.includes("\0")||text.length>MAX_EXTRACT_ENTRY_SIZE)continue;
const  baseName=dotIdx>0?fileName.slice(0,dotIdx):fileName;
const  title=baseName.trim().slice(0,100)||"Imported Snippet";
let  inferredCategory="General";
for(let  i=0;i<segments.length-1;i++){const  m=validCats.find((c)=>c.toLowerCase()===segments[i].toLowerCase());
if(m){inferredCategory=m;break;}
}
if(inferredCategory==="General"){if(/^(js|ts|jsx|tsx|py|html?|css|c|cpp|cs|java|go|rs|php|rb|json|ya?ml|xml)$/.test(ext))inferredCategory="Programming";
else  if(/^(sh|bash|bat|cmd|ps1|sql)$/.test(ext))inferredCategory="Commands";
else  if(/^(md|txt)$/.test(ext))inferredCategory="Notes";
}
snippets.push({title,category:inferredCategory,originalCategory:inferredCategory,content:text.slice(0,10000),checked:true});
}
}
return  snippets;
}
function getZipUploadMode(){return  zipModeExtract&&zipModeExtract.checked?"extract":"full";
}
function updateZipModalModeUI(){const  isFull=getZipUploadMode()==="full";
if(zipFullDetailsSection)zipFullDetailsSection.classList.toggle("hidden",!isFull||!currentZipFile);
if(zipPreviewSection)zipPreviewSection.classList.toggle("hidden",isFull||!currentZipFile||parsedZipSnippets.length===0);
if(isFull){if(confirmZipImportBtn)confirmZipImportBtn.disabled=!currentZipFile;
const  btnText=confirmZipImportBtn?confirmZipImportBtn.querySelector(".btn-text"):null;
if(btnText)btnText.textContent="Save Full ZIP File";
if(zipCategoryOption&&(zipCategoryOption.value==="auto"||!zipCategoryOption.value)){zipCategoryOption.value="ZIP Archive";
}
}else{if(zipCategoryOption&&zipCategoryOption.value==="ZIP Archive"){zipCategoryOption.value="auto";
}
updateConfirmButtonCount();
}
}
async function saveFullZipSnippet(){hideZipError();
if(!currentZipFile)return  displayZipError("Please select a ZIP file first.");
const  title=((zipFullTitle?zipFullTitle.value.trim():"")||currentZipFile.name||"archive.zip").slice(0,100);
const  selCat=zipCategoryOption?zipCategoryOption.value:"ZIP Archive";
const  category=(selCat==="auto"?"ZIP Archive":normalizeCategory(selCat))||"ZIP Archive";
setImportingState(true);
try{const  fileEntries=currentZipFilesMeta.map((f)=>({name:f.name,size:f.size}));
let  base64Data="";
if(currentZipFile.size<=6750){try{const  b64=await  readFileAsBase64(currentZipFile);if(b64&&b64.length<=9000)base64Data=b64;}catch{}
}
const  descriptor={__quickcopy_zip__:true,fileName:currentZipFile.name,fileSize:currentZipFile.size,fileCount:fileEntries.length,files:fileEntries};
if(base64Data){descriptor.base64=base64Data;if(JSON.stringify(descriptor).length>9500)delete  descriptor.base64;}
if(!descriptor.base64&&typeof  JSZip!=="undefined"&&(currentZipBlob||currentZipFile)){
try{const  zip=await  JSZip.loadAsync(currentZipBlob||currentZipFile);
const  binaryExts=new  Set("png,jpg,jpeg,gif,bmp,ico,webp,tiff,psd,exe,dll,so,dylib,bin,iso,img,dmg,zip,tar,gz,7z,rar,bz2,xz,pdf,doc,docx,xls,xlsx,ppt,pptx,mp3,wav,flac,aac,ogg,mp4,mkv,avi,mov,wmv,ttf,otf,woff,woff2,eot,class,jar,pyc,pyo,o,obj".split(","));
for(const  f of  descriptor.files){
const  ext=f.name.split(".").pop().toLowerCase();
if(binaryExts.has(ext))continue;
const  entry=zip.file(f.name);
if(!entry)continue;
try{const  text=await  entry.async ("string");
if(text&&!text.includes("\0")){f.content=text;if(JSON.stringify(descriptor).length>9500){delete  f.content;break;}}}catch{}
}}catch{}
}
let  contentString=JSON.stringify(descriptor);
if(contentString.length>9500){descriptor.files.forEach((f)=>{delete  f.content;});descriptor.files=descriptor.files.slice(0,30).map((f)=>({name:f.name.slice(0,80),size:f.size}));contentString=JSON.stringify(descriptor);
}
if(contentString.length>9900){descriptor.files=[];contentString=JSON.stringify(descriptor);
}
const  now=Date.now();
if(isDemoMode){const  snippetId=`demo-${now}`;
const  newSnippet={id:snippetId,title,category,content:contentString,created_at:new  Date().toISOString()};
await  saveZipBlobToDB(snippetId,currentZipBlob||currentZipFile);
allSnippets.unshift(newSnippet);
saveDemoSnippets();
}else{const  payload=[{title,category:toDbCategory(category),content:contentString}];
const {data,error}=await  supabaseClient.from("snippets").insert(payload).select();
if(error){
setImportingState(false);
return  displayZipError("Could not save snippets to the database.\nPlease try again.");
}
const  created=(data&&data[0])||{id:`zip-${now}`,title,category:"ZIP Archive",content:contentString,created_at:new  Date().toISOString()};
created.category="ZIP Archive";
if(created.id)await  saveZipBlobToDB(created.id,currentZipBlob||currentZipFile);
allSnippets.unshift(created);
}
setImportingState(false);
closeZipModal();
filterSnippets();
showToast("Saved full ZIP file!");
}catch(err){
setImportingState(false);
displayZipError("Could not save snippets to the database.\nPlease try again.");
}
}
function applyZipCategoryOptionChange(){if(!zipCategoryOption||parsedZipSnippets.length===0)return;
const  selCat=zipCategoryOption.value;
parsedZipSnippets.forEach((s)=>{s.category=selCat==="auto"?s.originalCategory:selCat;});
renderZipPreview();
}
function toggleSelectAllZipSnippets(checked){parsedZipSnippets.forEach((s)=>(s.checked=checked));
if(zipPreviewList){zipPreviewList.querySelectorAll(".zip-preview-item-checkbox").forEach((cb)=>(cb.checked=checked));
}
updateConfirmButtonCount();
}
function updateZipSelectAllState(){if(!zipSelectAllCheckbox||parsedZipSnippets.length===0)return;
zipSelectAllCheckbox.checked=parsedZipSnippets.every((s)=>s.checked);
zipSelectAllCheckbox.indeterminate=parsedZipSnippets.some((s)=>s.checked)&&!zipSelectAllCheckbox.checked;
}
function updateConfirmButtonCount(){if(!confirmZipImportBtn)return;
const  count=parsedZipSnippets.filter((s)=>s.checked).length;
confirmZipImportBtn.disabled=count===0;
const  btnText=confirmZipImportBtn.querySelector(".btn-text");
if(btnText)btnText.textContent=count>0?`Import (${count}) Snippet${count === 1 ? "" : "s"}`:"Import Snippets";
}
function renderZipPreview(){if(!zipPreviewList||!zipPreviewSection)return;
zipPreviewList.innerHTML="";
const  totalCount=parsedZipSnippets.length;
zipPreviewSummary.textContent=`Found ${totalCount} snippet${totalCount === 1 ? "" : "s"}`;
updateZipSelectAllState();
parsedZipSnippets.forEach((snippet)=>{const  checkbox=makeEl("input","zip-preview-item-checkbox");
checkbox.type="checkbox";
checkbox.checked=!!snippet.checked;
checkbox.setAttribute("aria-label",`Select snippet "${snippet.title}"`);
checkbox.addEventListener("change",()=>{snippet.checked=checkbox.checked;
updateZipSelectAllState();
updateConfirmButtonCount();
hideZipError();
});
const  cat=snippet.category||"General";
const  raw=snippet.content||"";
const  item=makeEl("div","zip-preview-item",undefined,[
checkbox,
makeEl("div","zip-preview-item-content",undefined,[
makeEl("div","zip-preview-item-header",undefined,[
makeEl("span","zip-preview-title",snippet.title||"Untitled Snippet"),
makeEl("span",`category-badge badge-${cat.toLowerCase().replace(/[^a-z0-9]/g, "")}`,cat),
makeEl("span","zip-preview-chars",`${raw.length} chars`)
]),
makeEl("pre","zip-preview-snippet",raw.length>200?raw.slice(0,200)+"...":raw)
])
]);
zipPreviewList.appendChild(item);
});
zipPreviewSection.classList.remove("hidden");
updateConfirmButtonCount();
}
async function importSelectedZipSnippets(){hideZipError();
const  selectedSnippets=parsedZipSnippets.filter((s)=>s.checked);
if(selectedSnippets.length===0)return  displayZipError("Please select at least one snippet to import.");
setImportingState(true);
const  now=Date.now();
if(isDemoMode){setTimeout(()=>{try{const  createdItems=selectedSnippets.map((s,idx)=>({id:`demo-${now}-${idx}`,
title:s.title,
category:s.category,
content:s.content,
created_at:new  Date(now-idx*1000).toISOString()
}));
allSnippets.unshift(...createdItems);
saveDemoSnippets();
setImportingState(false);
closeZipModal();
filterSnippets();
showToast(`Successfully imported ${createdItems.length} snippet${createdItems.length === 1 ? "" : "s"} from ZIP!`);
}catch(err){
setImportingState(false);
displayZipError("Could not save imported snippets locally. Please try again.");
}
},200);
return;
}
try{const  payload=selectedSnippets.map((s)=>({title:s.title,category:toDbCategory(s.category),content:s.content}));
const {data,error}=await  supabaseClient.from("snippets").insert(payload).select();
if(error){
setImportingState(false);
return  displayZipError("Could not save snippets to the database.\nPlease try again.");
}
if(data&&data.length>0){allSnippets.unshift(...data.map((s)=>{if(isFullZipSnippet(s))s.category="ZIP Archive";return  s;}));
}else{allSnippets.unshift(...selectedSnippets.map((s,idx)=>({id:`imported-${now}-${idx}`,
title:s.title,
category:s.category,
content:s.content,
created_at:new  Date().toISOString()
})));
}
setImportingState(false);
closeZipModal();
filterSnippets();
showToast(`Successfully imported ${selectedSnippets.length} snippet${selectedSnippets.length === 1 ? "" : "s"} from ZIP!`);
}catch(err){
setImportingState(false);
displayZipError("Could not save snippets to the database.\nPlease try again.");
}
}
function encodeQuickPayload(s,a){try{if(!s)return  "";
const  o={i:s.id||"",t:s.title||"",c:s.category||"General",b:s.content||"",a:a==="download"?"dl":"copy",z:isFullZipSnippet(s)?1:0};
return  btoa(encodeURIComponent(JSON.stringify(o)).replace(/%([0-9A-F]{2})/g,(_,p)=>String.fromCharCode("0x"+p))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}catch{return  "";}
}
function decodeQuickPayload(h){try{if(!h)return  null;
let  r=h.startsWith("#")?h.slice(1):h;
if(r.startsWith("q="))r=r.slice(2);
if(!r)return  null;
let  norm=r.replace(/-/g,"+").replace(/_/g,"/");
while(norm.length%4)norm+="=";
const  o=JSON.parse(decodeURIComponent(Array.prototype.map.call(atob(norm),(c)=>"%"+("00"+c.charCodeAt(0).toString(16)).slice(-2)).join("")));
return  o&&o.t?{id:o.i||("q-"+Date.now()),title:o.t,category:o.c||"General",content:o.b||"",action:o.a==="dl"?"download":"copy",zip:!!o.z}:null;
}catch{return  null;}
}
function getSelectedQuickLinkAction(){return  quickLinkModeDownload&&quickLinkModeDownload.checked?"download":"copy";
}
function getQuickLink(snippet,action){if(!snippet)return(typeof  window!=="undefined"&&window.location?window.location.href:"");
const  act=action==="download"||(!action&&isFullZipSnippet(snippet))?"download":"copy";
const  p=act==="download"?(snippet.id?("dl="+encodeURIComponent(snippet.id)):"action=download"):(snippet.id?("copy="+encodeURIComponent(snippet.id)):"action=copy");
const  base=(typeof  window!=="undefined"&&window.location&&window.location.href)?window.location.href.split("?")[0].split("#")[0]:"quickcopy/index.html";
const  payload=encodeQuickPayload(snippet,act);
return  base+"?"+p+(payload?("#q="+payload):"");
}
function updateQuickLinkQr(url){if(!quickLinkQrImg)return;
if(!url){quickLinkQrImg.src="";return;}
let  qrData=url;
if(url.length>600&&url.includes("?"))qrData=url.split("#")[0];
quickLinkQrImg.src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=4&data="+encodeURIComponent(qrData);
}
function openQuickLinkModal(snippet,defaultAction){if(!quickLinkModal)return;lastFocusedElement=document.activeElement;
if(!snippet&&allSnippets.length>0)snippet=allSnippets[0];
currentQuickLinkSnippet=snippet;
const  act=defaultAction||(snippet&&isFullZipSnippet(snippet)?"download":"copy");
if(quickLinkModeCopy)quickLinkModeCopy.checked=act==="copy";
if(quickLinkModeDownload)quickLinkModeDownload.checked=act==="download";
const  linkUrl=snippet?getQuickLink(snippet,act):"";
if(quickLinkInput)quickLinkInput.value=linkUrl;
if(copyQuickLinkBtn){const  t=copyQuickLinkBtn.querySelector(".btn-text")||copyQuickLinkBtn;
t.textContent="📋 Copy QuickLink";
copyQuickLinkBtn.classList.remove("is-copied");
}
updateQuickLinkQr(linkUrl);
quickLinkModal.classList.remove("hidden");
document.body.style.overflow="hidden";
setTimeout(()=>{if(quickLinkInput){quickLinkInput.focus();quickLinkInput.select();}},50);
}
function updateQuickLinkModalLink(){if(currentQuickLinkSnippet&&quickLinkInput){const  linkUrl=getQuickLink(currentQuickLinkSnippet,getSelectedQuickLinkAction());quickLinkInput.value=linkUrl;updateQuickLinkQr(linkUrl);
}
}
function handleOpenPastedQuickLink(){
if(!quickLinkPasteInput)return;
const  raw=quickLinkPasteInput.value.trim();
if(!raw)return  showToast("Please enter or paste a QuickLink URL.");
closeQuickLinkModal();
handleIncomingQuickLink(raw);
}
function copyCurrentQuickLink(){if(!quickLinkInput||!quickLinkInput.value)return;
const  val=quickLinkInput.value;
const  ok=()=>{if(copyQuickLinkBtn){const  t=copyQuickLinkBtn.querySelector(".btn-text")||copyQuickLinkBtn;
const  orig=t.textContent;
t.textContent="✓ Copied QuickLink!";
copyQuickLinkBtn.classList.add("is-copied");
setTimeout(()=>{t.textContent=orig;copyQuickLinkBtn.classList.remove("is-copied");},2000);
}
showToast("QuickLink copied to clipboard!");
};
if(navigator.clipboard&&typeof  navigator.clipboard.writeText==="function"){navigator.clipboard.writeText(val).then(ok).catch(()=>fallbackExecCommandCopy(val,ok));
}else{fallbackExecCommandCopy(val,ok);
}
}
function closeQuickLinkModal(){if(quickLinkModal){quickLinkModal.classList.add("hidden");
document.body.style.overflow="";
if(lastFocusedElement&&typeof  lastFocusedElement.focus==="function")lastFocusedElement.focus();
}
}
function closeQuickActionOverlay(){if(quickActionOverlay){quickActionOverlay.classList.add("hidden");
document.body.style.overflow="";
try{if(window.history&&typeof  window.history.replaceState==="function"){const  url=new  URL(window.location.href);
url.searchParams.delete("copy");
url.searchParams.delete("dl");
url.searchParams.delete("action");
url.searchParams.delete("id");
url.searchParams.delete("q");
url.hash="";
const  clean=url.pathname+(url.search&&url.search!=="?"?url.search:"");
window.history.replaceState(null,"",clean);
}
}catch{try{if(window.history&&window.history.replaceState)window.history.replaceState(null,"",window.location.pathname);}catch{}
}
if(lastFocusedElement&&typeof  lastFocusedElement.focus==="function")lastFocusedElement.focus();
}
}
function handleQuickActionCopy(){if(!currentQuickActionSnippet)return;
const  isZip=isFullZipSnippet(currentQuickActionSnippet);
const  text=isZip?(quickActionPreview?quickActionPreview.textContent:currentQuickActionSnippet.title):(currentQuickActionSnippet.content||"");
copySnippet(text,quickActionCopyBtn,"Copied snippet to clipboard!",()=>{if(quickActionBadge){quickActionBadge.textContent="✓ Copied to clipboard!";
quickActionBadge.className="quickaction-badge";
}
if(quickActionCopyBtn){const  t=quickActionCopyBtn.querySelector(".btn-text")||quickActionCopyBtn;
t.textContent="✓ Copied!";
}
});
}
function handleQuickActionDownload(){if(!currentQuickActionSnippet)return;
if(isFullZipSnippet(currentQuickActionSnippet))downloadFullZipSnippet(currentQuickActionSnippet,quickActionDownloadBtn);
else  downloadSingleSnippetZip(currentQuickActionSnippet,quickActionDownloadBtn);
}
async function handleIncomingQuickLink(customUrl){if(typeof  window==="undefined"||!window.location)return;
let  search=window.location.search||"",hash=window.location.hash||"";
if(typeof  customUrl==="string"&&customUrl){
const  hashIdx=customUrl.indexOf("#");
hash=hashIdx>=0?customUrl.slice(hashIdx):(customUrl.startsWith("q=")?("#"+customUrl):"");
const  qIdx=customUrl.indexOf("?");
if(qIdx>=0)search=hashIdx>qIdx?customUrl.slice(qIdx,hashIdx):customUrl.slice(qIdx);
}
const  params=new  URLSearchParams(search);
const  copyParam=params.get("copy"),dlParam=params.get("dl"),actionParam=params.get("action"),idParam=params.get("id");
const  hasPayload=hash.includes("q=")||params.has("q");
if(copyParam===null&&dlParam===null&&!actionParam&&!idParam&&!hasPayload)return;
let  action=dlParam!==null?"download":"copy";
let  targetId=dlParam!==null?dlParam:(copyParam!==null?copyParam:(idParam||""));
if(actionParam)action=actionParam.toLowerCase()==="download"?"download":"copy";
let  snippet=decodeQuickPayload(hash)||decodeQuickPayload(params.get("q")||"");
if(snippet){if(snippet.action)action=snippet.action;
if(!targetId&&snippet.id)targetId=snippet.id;
}
if(!snippet||!snippet.content)snippet=allSnippets.find((s)=>String(s.id)===String(targetId));
if(!snippet||!snippet.content){try{const  stored=localStorage.getItem("quickcopy_demo_snippets");
if(stored)snippet=JSON.parse(stored).find((s)=>String(s.id)===String(targetId));
}catch{}
}
if((!snippet||!snippet.content)&&supabaseClient&&targetId){try{const {data}=await  supabaseClient.from("snippets").select("id, title, category, content, created_at").eq("id",targetId).single();
if(data)snippet=data;
}catch{}
}
const  snippetFound=!!(snippet&&snippet.content);
if(!snippetFound)snippet={id:targetId||"shared",title:"Shared Snippet",category:"General",content:"Could not locate snippet."};
if(isFullZipSnippet(snippet)){snippet.category="ZIP Archive";const  desc=parseZipDescriptor(snippet);if(desc&&desc.base64&&snippet.id){try{await  saveZipBlobToDB(snippet.id,base64ToBlob(desc.base64,"application/zip"));}catch{}}}
if(!allSnippets.some((s)=>String(s.id)===String(snippet.id))){allSnippets.unshift(snippet);
if(typeof  filterSnippets==="function")filterSnippets();
}
currentQuickActionSnippet=snippet;
const  isZip=isFullZipSnippet(snippet);
if(quickActionTitle)quickActionTitle.textContent=snippet.title||"QuickCopy Snippet";
if(quickActionPreview){if(isZip){const  d=parseZipDescriptor(snippet)||{};
const  fc=d.fileCount||(d.files?d.files.length:0);
const  lines=["📦 Full ZIP Archive:"+(d.fileName||snippet.title),"Files:"+fc+"|Size:"+formatBytes(d.fileSize||0)];
if(d.files&&d.files.length>0)lines.push("Archive contents:\n"+d.files.map((f)=>"-"+f.name+"("+formatBytes(f.size)+")").join("\n"));
quickActionPreview.textContent=lines.join("\n");
}else{quickActionPreview.textContent=snippet.content||"";
}
}
if(!snippetFound){if(quickActionBadge){quickActionBadge.textContent="⚠️ Snippet not found";
quickActionBadge.className="quickaction-badge is-warning";
}
if(quickActionCopyBtn)quickActionCopyBtn.textContent="📋 Copy Snippet";
}else  if(action==="copy"){const  textToCopy=isZip?(quickActionPreview?quickActionPreview.textContent:snippet.title):(snippet.content||"");
const  onCopySuccess=()=>{if(quickActionBadge){quickActionBadge.textContent="✓ Copied to clipboard automatically!";
quickActionBadge.className="quickaction-badge";
}
if(quickActionCopyBtn){const  t=quickActionCopyBtn.querySelector(".btn-text")||quickActionCopyBtn;
t.textContent="📋 Copy Again";
}
showToast("✓ Copied automatically via QuickLink!");
};
const  onCopyBlocked=()=>{if(quickActionBadge){quickActionBadge.textContent="⚠️ Click Copy below to grant clipboard access";
quickActionBadge.className="quickaction-badge is-warning";
}
if(quickActionCopyBtn){quickActionCopyBtn.textContent="📋 Copy Snippet";
quickActionCopyBtn.focus();
}
showToast("Click 'Copy Snippet' below to copy to clipboard","📋 Copy",()=>handleQuickActionCopy());
};
if(navigator.clipboard&&typeof  navigator.clipboard.writeText==="function"){
try{
await  navigator.clipboard.writeText(textToCopy);
onCopySuccess();
}catch{
fallbackExecCommandCopy(textToCopy,onCopySuccess,onCopyBlocked);
}
}else{
fallbackExecCommandCopy(textToCopy,onCopySuccess,onCopyBlocked);
}
}else  if(action==="download"){if(quickActionBadge){quickActionBadge.textContent="📥 Downloading...";
quickActionBadge.className="quickaction-badge is-downloading";
}
setTimeout(()=>{if(isZip)downloadFullZipSnippet(snippet,quickActionDownloadBtn);
else  downloadSingleSnippetZip(snippet,quickActionDownloadBtn);
},120);
showToast("📥 Download started via QuickLink!");
}
if(quickActionOverlay){lastFocusedElement=document.activeElement;
quickActionOverlay.classList.remove("hidden");
document.body.style.overflow="hidden";
}
}
if(typeof  window!=="undefined"){window.toDbCategory=toDbCategory;
window.getQuickLink=getQuickLink;
window.openQuickLinkModal=openQuickLinkModal;
window.handleIncomingQuickLink=handleIncomingQuickLink;
window.decodeQuickPayload=decodeQuickPayload;
window.encodeQuickPayload=encodeQuickPayload;
}