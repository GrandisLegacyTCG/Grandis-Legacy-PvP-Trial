/** Regression: a bogus reconnect must never allocate a phantom room. */
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
const port=Number(process.env.PVP_TEST_PORT||3000);
const origin=`http://127.0.0.1:${port}`;
const rooms=async()=>(await (await fetch(origin+'/health')).json()).rooms;
const makeRoom=()=>`reject_${randomBytes(6).toString('hex')}`;
async function attempt(room,seatToken){
  const socket=new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const messages=[];
  socket.addEventListener('message',e=>{try{messages.push(JSON.parse(e.data))}catch{}});
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
  try{
    socket.send(JSON.stringify({type:'hello',room,token:seatToken,name:'Untrusted reconnect'}));
    const until=Date.now()+3000;
    while(Date.now()<until&&!messages.some(x=>x.type==='error'))await delay(10);
    assert.match(messages.find(x=>x.type==='error')?.message||'',/unknown or expired/i);
  }finally{socket.close()}
}
const before=await rooms();
for(let i=0;i<3;i++)await attempt(makeRoom(),'a'.repeat(64));
assert.equal(await rooms(),before,'Invalid reconnect token must not allocate a fresh room');
console.log('PASS: unknown reconnect tokens do not allocate phantom rooms or exhaust the room capacity.');
