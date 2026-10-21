import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const config=window.HEMMAKOMPASSEN_BACKEND;
const client=createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const setText=(id,value)=>{$(id).textContent=value;};
async function load(){
  const {data:{user},error}=await client.auth.getUser();
  if(!user){setText('home-status','Logga in med din e-postadress för att fortsätta.');setText('primary-link','Logga in eller skapa konto');return;}
  if(error)throw error;
  const {data:profile,error:profileError}=await client.from('profiles').select('display_name').eq('user_id',user.id).maybeSingle();
  if(profileError)throw profileError;
  const name=profile?.display_name?.trim()||'du';
  setText('greeting','Välkommen, '+name);
  setText('intro','Du är inloggad i Hemmakompassen med '+user.email+'.');
  setText('home-status','Ditt konto är anslutet till Supabase.');
  setText('primary-link','Hantera familj och konto');
  $('features').classList.remove('hidden');
  const {data:members,error:membersError}=await client.rpc('my_family_members');
  if(membersError)throw membersError;
  $('member-panel').classList.remove('hidden');
  if(members?.length){
    setText('family-members',members.map(m=>(m.role==='teen'?'Tonåring':'Förälder')+': '+(m.display_name||'Namnlös')).join(' · '));
    setText('family-note',members.length===1?'Du är den enda familjemedlemmen än så länge. Skapa en inbjudningskod på kontosidan för att bjuda in den andra personen.':'Ni är anslutna till samma familj.');
  }else{
    setText('family-members','Ingen familj är kopplad ännu.');
    setText('family-note','Skapa en familj eller ange en inbjudningskod på kontosidan.');
  }
}
load().catch(e=>setText('home-status','Kunde inte läsa kontot: '+(e.message||'Okänt fel')+'. Försök öppna kontosidan.'));
client.auth.onAuthStateChange(()=>setTimeout(()=>load().catch(e=>setText('home-status',e.message)),0));
