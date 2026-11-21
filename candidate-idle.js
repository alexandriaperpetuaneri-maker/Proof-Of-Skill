"use strict";

window.createCandidateIdleTimer = ({userId,fresh,onWarning,onExpire}) => {
  const idleMs=30*60*1000;
  const warningMs=2*60*1000;
  const activityEvents=["pointerdown","keydown","input","wheel"];
  const key=`proof-of-skill-candidate-activity:${userId}`;
  let lastActivity=0;
  let lastWrite=0;
  let timer;
  let active=false;
  let warning=false;

  function storedActivity(now) {
    try {
      const saved=Number(localStorage.getItem(key));
      return saved>0 && saved<=now ? saved : 0;
    } catch {
      return 0;
    }
  }

  function markActivity(now) {
    lastActivity=now;
    if (now-lastWrite<1000) return;
    lastWrite=now;
    try {
      localStorage.setItem(key,String(now));
    } catch {
      // The open page still enforces its own timer if storage is unavailable.
    }
  }

  function warn(next) {
    if (warning===next) return;
    warning=next;
    onWarning(next);
  }

  function check(recordActivity=false) {
    if (!active) return false;
    clearTimeout(timer);
    const now=Date.now();
    lastActivity=Math.max(lastActivity,storedActivity(now));
    let remaining=idleMs-(now-lastActivity);
    if (remaining<=0) {
      stop();
      onExpire();
      return false;
    }
    if (recordActivity) {
      markActivity(now);
      remaining=idleMs;
    }
    warn(remaining<=warningMs);
    timer=setTimeout(check,remaining>warningMs ? remaining-warningMs : remaining);
    return true;
  }

  function keepAlive() {
    if (!document.hidden) check(true);
  }
  function activity(event) {
    if (event.isTrusted && !event.target?.closest?.("#session-warning")) keepAlive();
  }
  function wake() {
    check();
  }
  function sync(event) {
    if (event.key===key) check();
  }

  function stop() {
    active=false;
    clearTimeout(timer);
    for (const event of activityEvents) document.removeEventListener(event,activity,true);
    document.removeEventListener("visibilitychange",wake);
    window.removeEventListener("pageshow",wake);
    window.removeEventListener("storage",sync);
    warn(false);
  }

  function start() {
    if (active) return true;
    const now=Date.now();
    lastActivity=fresh ? 0 : storedActivity(now);
    if (!lastActivity) markActivity(now);
    active=true;
    for (const event of activityEvents) document.addEventListener(event,activity,{capture:true,passive:true});
    document.addEventListener("visibilitychange",wake);
    window.addEventListener("pageshow",wake);
    window.addEventListener("storage",sync);
    return check();
  }

  return {start,stop,keepAlive};
};
