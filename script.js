const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const STORAGE_KEY = "studyflow_tasks_v1";
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || [
  {id:1,title:"Review today's lecture notes",category:"Study",priority:"High",done:false},
  {id:2,title:"Practice 3 coding problems",category:"Study",priority:"Medium",done:false},
  {id:3,title:"Work on personal project",category:"Project",priority:"Medium",done:true}
];
let sessions = Number(localStorage.getItem("studyflow_sessions") || 0);
let activeFilter = "all", searchQuery = "", timerSeconds = 25*60, timerRunning = false, timerInterval = null, currentMinutes = 25;

function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks));}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function taskMarkup(t){
 return `<div class="task-row ${t.done?'done':''}" data-id="${t.id}">
 <button class="task-check" aria-label="${t.done?'Mark incomplete':'Mark complete'}">${t.done?'✓':''}</button>
 <div class="task-info"><div class="task-title">${escapeHtml(t.title)}</div><div class="task-meta"><span class="tag ${escapeHtml(t.category)}">${escapeHtml(t.category)}</span><span class="priority">${escapeHtml(t.priority)} priority</span></div></div>
 <button class="delete-task" aria-label="Delete task" title="Delete task">×</button></div>`;
}
function renderTasks(){
 const filtered = tasks.filter(t=>activeFilter==="all"||(activeFilter==="active"&&!t.done)||(activeFilter==="done"&&t.done));
 const query = searchQuery.trim().toLowerCase();
 const visible = filtered.filter(t=>!query || [t.title,t.category,t.priority].some(value=>value.toLowerCase().includes(query)));
 $("#task-list").innerHTML = tasks.slice(0,4).map(taskMarkup).join("") || `<p class="empty-state">Nothing here yet. Add your first task ✨</p>`;
 $("#all-task-list").innerHTML = visible.map(taskMarkup).join("") || `<p class="empty-state">${query ? "No tasks match your search. Try another keyword." : "No tasks in this view. You're all caught up!"}</p>`;
 const done=tasks.filter(t=>t.done).length, remaining=tasks.length-done, percent=tasks.length?Math.round(done/tasks.length*100):0;
 $("#completed-count").textContent=done;$("#remaining-count").textContent=remaining;$("#session-count").textContent=sessions;
 $("#progress-fill").style.width=percent+"%";$("#progress-label").textContent=percent+"% complete";
}
function addTask(title,category="Study",priority="Medium"){
 title=title.trim();if(!title)return;
 tasks.unshift({id:Date.now(),title,category,priority,done:false});save();renderTasks();
}
function onTaskAction(e){
 const row=e.target.closest(".task-row");if(!row)return;const id=Number(row.dataset.id);
 if(e.target.closest(".task-check")){const t=tasks.find(t=>t.id===id);if(t)t.done=!t.done;}
 else if(e.target.closest(".delete-task"))tasks=tasks.filter(t=>t.id!==id);
 save();renderTasks();
}
$("#task-list").addEventListener("click",onTaskAction);$("#all-task-list").addEventListener("click",onTaskAction);
function openDialog(){$("#task-dialog").showModal();$("#task-title").focus();}
$("#hero-add").addEventListener("click",openDialog);$("#all-add").addEventListener("click",openDialog);
$("#task-form").addEventListener("submit",e=>{
 e.preventDefault();addTask($("#task-title").value,$("#task-category").value,$("#task-priority").value);
 $("#task-form").reset();$("#task-dialog").close();
});
function quickAdd(){addTask($("#quick-task").value);$("#quick-task").value="";}
$("#quick-add").addEventListener("click",quickAdd);$("#quick-task").addEventListener("keydown",e=>{if(e.key==="Enter")quickAdd();});
function showView(view){
 ["dashboard","tasks","focus"].forEach(v=>$("#"+v+"-view").classList.toggle("hidden",v!==view));
 $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 $("#page-title").textContent=({dashboard:"Good things start today.",tasks:"Your plans, all in one place.",focus:"Make space to focus."})[view];
}
$$(".nav-item").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$("#view-all").addEventListener("click",()=>showView("tasks"));
$$(".filter").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;$$(".filter").forEach(x=>x.classList.toggle("active",x===b));renderTasks();}));
$("#task-search").addEventListener("input",e=>{searchQuery=e.target.value;renderTasks();});
$("#clear-search").addEventListener("click",()=>{$("#task-search").value="";searchQuery="";renderTasks();$("#task-search").focus();});
$("#start-focus").addEventListener("click",()=>{showView("focus");});
function formatTime(n){return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");}
function updateTimer(){$("#big-timer").textContent=formatTime(timerSeconds);$(".focus-ring span").textContent=formatTime(timerSeconds);}
function stopTimer(){clearInterval(timerInterval);timerInterval=null;timerRunning=false;$("#timer-toggle").textContent="Start timer";}
function startTimer(){
 if(timerRunning){stopTimer();return;}
 timerRunning=true;$("#timer-toggle").textContent="Pause timer";
 timerInterval=setInterval(()=>{
  timerSeconds--;updateTimer();
  if(timerSeconds<=0){stopTimer();$("#timer-hint").textContent="Session complete — take a breath! ✨";
   if(currentMinutes===25){sessions++;localStorage.setItem("studyflow_sessions",sessions);renderTasks();}
   if("Notification" in window && Notification.permission==="granted")new Notification("StudyFlow",{body:"Your timer is complete. Nice work!"});
   else alert("Timer complete! Take a breath ✨");
  }
 },1000);
}
$("#timer-toggle").addEventListener("click",startTimer);
$("#timer-reset").addEventListener("click",()=>{stopTimer();timerSeconds=currentMinutes*60;updateTimer();$("#timer-hint").textContent="Your next step is enough.";});
$$(".mode").forEach(b=>b.addEventListener("click",()=>{$$(".mode").forEach(x=>x.classList.toggle("active",x===b));currentMinutes=Number(b.dataset.minutes);stopTimer();timerSeconds=currentMinutes*60;updateTimer();$("#timer-hint").textContent="Your next step is enough.";}));
$("#today-date").textContent=new Intl.DateTimeFormat("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"}).format(new Date());
renderTasks();updateTimer();
