import json
import sys
from datetime import datetime,timezone
import pytest

NOW=2_000_000_000
GEN=10**18
ID='0123456789ABCDEF'
PAGE='01JMDK9XYNY6RXSED6SDWW50WY'
SCOPE='Fetch complete current organization Costs data specifically through the Compliance API.'

def j(x):return json.loads(x)
def clock(vm,n):
    text=datetime.fromtimestamp(n,timezone.utc).isoformat().replace('+00:00','Z')
    vm.warp(text)
    gl=sys.modules.get('genlayer.gl')
    if gl is not None and getattr(gl,'message_raw',None) is not None:gl.message_raw['datetime']=text
def addr(x):
    from genlayer.py.types import Address
    return (Address(x) if isinstance(x,bytes) else x).as_hex.lower()
def create(c,vm,a,lease='lease-one',**changes):
    clock(vm,NOW);vm.sender=a[0]
    values=dict(lease_id=lease,buyer=a[1],scope=SCOPE,incident_ids=json.dumps([ID]),
        reference_start=NOW-1500,reference_end=NOW-500,accept_deadline=NOW+60,
        base_deadline=NOW+120,extension_cap=180)
    values.update(changes)
    c.create_lease(*values.values());return lease
def paid(c,vm,a,lease='lease-one',**kw):
    create(c,vm,a,lease,**kw);vm.sender=a[1];vm.value=GEN
    try:c.accept(lease,j(c.get_lease(lease))['digest'])
    finally:vm.value=0
    return lease
def source(ids=None):
    ids=ids or [ID]
    records=[]
    for incident_id in ids:
        updates=[]
        for k in range(5):
            t=datetime.fromtimestamp(NOW-1200+k*100,timezone.utc).isoformat().replace('+00:00','Z')
            updates.append(dict(id=f'u{k}',incident_id=incident_id,display_at=t,created_at=t,updated_at=t,
                status='resolved' if k==4 else 'monitoring' if k==3 else 'identified',body='Costs delayed, ordinary API inference unaffected.'))
        records.append(dict(id=incident_id,page_id=PAGE,name='Delayed Compliance API Costs',
            status='resolved',created_at=updates[0]['display_at'],resolved_at=updates[-1]['display_at'],
            updated_at=updates[-1]['display_at'],incident_updates=updates))
    return dict(page=dict(id=PAGE,url='https://status.openai.com/'),incidents=records,padding='x'*1200)
def model(classes=None,ids=None):
    ids=ids or [ID]
    values=classes or {f'{i}:u{k}':'APPLIES' for i in ids for k in range(4)}
    return {'classes':values,'intervals':{key:{'title_scope':'EXACT','title':value,'body':value,'generic':False,'recovery':False,'body_conflict':False} for key,value in values.items()},'reason':'Meaning independently checked.'}
def mock(vm,decision=None,body=None,status=200,consistency=None):
    vm.mock_web(r'.*status\.openai\.com.*',{'status':status,'body':json.dumps(source() if body is None else body)})
    vm.mock_llm(r'.*OutageClock independent reported-time reviewer.*',json.dumps(model() if decision is None else decision))
    decision = model() if decision is None else decision
    default_audit={'intervals':decision.get('intervals',{})}
    vm.mock_llm(r'.*OutageClock consistency verifier.*',json.dumps(default_audit if consistency is None else consistency))
def ready(c,vm,a,**kw):
    lease=paid(c,vm,a);mock(vm,**kw);vm.sender=a[1];c.review_clock(lease);return lease
def snap(c,lease):return (c.get_lease(lease),c.get_clock(lease),c.get_accounting())

def test_exact_terms_create_isolated_lease(contract,direct_vm,direct_accounts):
    lease=create(contract,direct_vm,direct_accounts)
    row=j(contract.get_lease(lease))
    assert row['issuer']==addr(direct_accounts[0]) and row['buyer']==addr(direct_accounts[1])
    assert row['state']=='OFFERED' and row['base_deadline']==NOW+120
    assert j(contract.get_accounting())['received_gen']=='0'

@pytest.mark.parametrize('actor,value,digest_kind',[(0,GEN,'good'),(2,GEN,'good'),(1,0,'good'),(1,2*GEN,'good'),(1,GEN,'bad')],ids=['issuer1GEN','outsider1GEN','buyer0GEN','buyer2GEN','wrongdigest1GEN'])
def test_accept_origin_amount_and_exact_binding_unchanged(contract,direct_vm,direct_accounts,actor,value,digest_kind):
    lease=create(contract,direct_vm,direct_accounts);before=snap(contract,lease)
    digest=j(contract.get_lease(lease))['digest'] if digest_kind=='good' else 'f'*64
    direct_vm.sender=direct_accounts[actor];direct_vm.value=value
    with pytest.raises(Exception):contract.accept(lease,digest)
    direct_vm.value=0;assert snap(contract,lease)==before

def test_paid_immutable_isolation_and_duplicate_accept(contract,direct_vm,direct_accounts):
    lease=paid(contract,direct_vm,direct_accounts);before=snap(contract,lease)
    direct_vm.value=GEN
    with pytest.raises(Exception):contract.accept(lease,j(contract.get_lease(lease))['digest'])
    direct_vm.value=0;assert snap(contract,lease)==before
    create(contract,direct_vm,direct_accounts,'other')
    assert j(contract.get_lease('other'))['state']=='OFFERED'
    assert j(contract.get_accounting())['escrow_gen']=='1'

def test_meaning_sets_deadline_then_exercise_after_nominal_expiry(contract,direct_vm,direct_accounts):
    lease=ready(contract,direct_vm,direct_accounts)
    row=j(contract.get_clock(lease));assert row['reported_seconds']==400 and row['extension_seconds']==180
    assert row['effective_deadline']==NOW+300
    clock(direct_vm,NOW+121);direct_vm.sender=direct_accounts[1];contract.exercise(lease)
    assert j(contract.get_lease(lease))['state']=='EXERCISED'
    assert j(contract.get_credit(lease))['owner']==addr(direct_accounts[0])
    assert j(contract.get_credit(lease))['credit_gen']=='1'
    assert j(contract.get_accounting())['escrow_gen']=='0'

def test_unaffected_mode_zero_extension_refund_actual_payer(contract,direct_vm,direct_accounts):
    lease=ready(contract,direct_vm,direct_accounts,decision=model({f'{ID}:u{k}':'NOT_APPLIES' for k in range(4)}))
    assert j(contract.get_clock(lease))['extension_seconds']==0
    clock(direct_vm,NOW+120);direct_vm.sender=direct_accounts[0];contract.recover(lease)
    assert j(contract.get_credit(lease))['owner']==addr(direct_accounts[1])
    assert j(contract.get_credit(lease))['credit_gen']=='1'

@pytest.mark.parametrize('mutation',['wrong_page','wrong_incident_page','missing','duplicate_incident','wrong_update_binding','duplicate_update','future','naive','unresolved','earlier_resolved','oversized','bad_json'])
def test_source_provenance_tripwire_blocks_hard_state_and_money(contract,direct_vm,direct_accounts,mutation):
    lease=paid(contract,direct_vm,direct_accounts);body=source();inc=body['incidents'][0]
    if mutation=='wrong_page':body['page']['id']='FORGED'
    elif mutation=='wrong_incident_page':inc['page_id']='FORGED'
    elif mutation=='missing':body['incidents']=[]
    elif mutation=='duplicate_incident':body['incidents']*=2
    elif mutation=='wrong_update_binding':inc['incident_updates'][1]['incident_id']='FORGED'
    elif mutation=='duplicate_update':inc['incident_updates'][1]['id']='u0'
    elif mutation=='future':inc['updated_at']='2099-01-01T00:00:00Z'
    elif mutation=='naive':inc['created_at']='2033-05-18T03:13:20'
    elif mutation=='unresolved':inc['status']='monitoring'
    elif mutation=='earlier_resolved':inc['incident_updates'][1]['status']='resolved'
    elif mutation=='oversized':body['padding']='x'*300001
    elif mutation=='bad_json':body={'invalid':'not an incident feed'}
    mock(direct_vm,body=body);direct_vm.sender=direct_accounts[1];contract.review_clock(lease)
    assert j(contract.get_lease(lease))['state']=='RETRYABLE'
    assert j(contract.get_clock(lease))['verified'] is False
    assert j(contract.get_accounting())['escrow_gen']=='1' and j(contract.get_accounting())['credit_gen']=='0'

@pytest.mark.parametrize('status',[404,503])
def test_unavailable_source_retains_escrow_with_hard_recovery(contract,direct_vm,direct_accounts,status):
    lease=paid(contract,direct_vm,direct_accounts);mock(direct_vm,status=status)
    contract.review_clock(lease)
    assert j(contract.get_accounting())['escrow_gen']=='1'
    clock(direct_vm,NOW+300);contract.recover(lease)
    assert j(contract.get_lease(lease))['state']=='REFUNDED'

@pytest.mark.parametrize('classes',[{f'{ID}:u0':'APPLIES'},{**{f'{ID}:u{k}':'APPLIES' for k in range(4)},'EXTRA':'APPLIES'},{f'{ID}:u{k}':'PAY' for k in range(4)}])
def test_invalid_output_before_mutation_and_settlement(contract,direct_vm,direct_accounts,classes):
    lease=paid(contract,direct_vm,direct_accounts);mock(direct_vm,decision=model(classes));before=snap(contract,lease)
    with pytest.raises(Exception):contract.review_clock(lease)
    assert snap(contract,lease)==before

def test_ambiguous_meaning_retry_does_not_move_credit(contract,direct_vm,direct_accounts):
    lease=ready(contract,direct_vm,direct_accounts,decision=model({f'{ID}:u{k}':'UNVERIFIABLE' for k in range(4)}))
    assert j(contract.get_lease(lease))['state']=='RETRYABLE'
    assert j(contract.get_clock(lease))['verified'] is False
    assert j(contract.get_accounting())['credit_gen']=='0'

@pytest.mark.parametrize('delta',[-1,0,1])
@pytest.mark.parametrize('method',['accept','review_clock','exercise','recover_ready','recover_pending','cancel_unpaid'])
def test_entrypoint_time_stale_phase_unchanged_rejection(contract,direct_vm,direct_accounts,method,delta):
    if method in ('accept','cancel_unpaid'):lease=create(contract,direct_vm,direct_accounts);boundary=NOW+60
    elif method in ('review_clock','recover_pending'):lease=paid(contract,direct_vm,direct_accounts);boundary=NOW+300;mock(direct_vm)
    else:lease=ready(contract,direct_vm,direct_accounts);boundary=NOW+300
    clock(direct_vm,boundary+delta);direct_vm.sender=direct_accounts[1];before=snap(contract,lease)
    actual='recover' if method.startswith('recover_') else method
    arguments=[lease,j(contract.get_lease(lease))['digest']] if method=='accept' else [lease]
    if method=='accept':direct_vm.value=GEN
    expected_success=(delta<0) if method in ('accept','review_clock','exercise') else delta>=0
    try:
        if expected_success:getattr(contract,actual)(*arguments)
        else:
            with pytest.raises(Exception):getattr(contract,actual)(*arguments)
    finally:direct_vm.value=0
    if not expected_success:assert snap(contract,lease)==before

@pytest.mark.parametrize('method',['review_clock','exercise','recover','cancel_unpaid','withdraw','close_lease'])
def test_wrong_caller_all_money_recovery_writes(contract,direct_vm,direct_accounts,method):
    lease=ready(contract,direct_vm,direct_accounts) if method not in ('cancel_unpaid',) else create(contract,direct_vm,direct_accounts)
    clock(direct_vm,NOW+300);direct_vm.sender=direct_accounts[2];before=snap(contract,lease)
    with pytest.raises(Exception):getattr(contract,method)(lease)
    assert snap(contract,lease)==before

def test_terminal_duplicate_recovery_exercise_review_and_no_orphan_close(contract,direct_vm,direct_accounts):
    lease=ready(contract,direct_vm,direct_accounts);contract.exercise(lease)
    before=snap(contract,lease)
    for name in ['exercise','review_clock','recover','accept','cancel_unpaid','close_lease']:
        args=[lease,j(contract.get_lease(lease))['digest']] if name=='accept' else [lease]
        with pytest.raises(Exception):getattr(contract,name)(*args)
        assert snap(contract,lease)==before

def test_duplicate_refund_attempt_cap_and_permanent_credit(contract,direct_vm,direct_accounts):
    lease=paid(contract,direct_vm,direct_accounts);mock(direct_vm,status=503)
    for _ in range(3):contract.review_clock(lease)
    before=snap(contract,lease)
    with pytest.raises(Exception):contract.review_clock(lease)
    assert snap(contract,lease)==before
    clock(direct_vm,NOW+300);contract.recover(lease);before=snap(contract,lease)
    with pytest.raises(Exception):contract.recover(lease)
    assert snap(contract,lease)==before
    clock(direct_vm,NOW+1000000);assert j(contract.get_credit(lease))['credit_gen']=='1'

@pytest.mark.parametrize('field,value',[('buyer',None),('scope',''),('incident_ids','[]'),('incident_ids',json.dumps([ID,ID])),('base_deadline',NOW+119),('base_deadline',NOW+86401),('accept_deadline',NOW+29),('extension_cap',29),('extension_cap',86401),('reference_start',NOW+1),('reference_end',NOW-1600)])
def test_create_bounds_and_bad_binding(contract,direct_vm,direct_accounts,field,value):
    with pytest.raises(Exception):create(contract,direct_vm,direct_accounts,**{field:value})
    assert j(contract.get_accounting())['received_gen']=='0'

def test_overlap_union_clipping_cap_not_double_counted(contract,direct_vm,direct_accounts):
    second='FEDCBA9876543210';ids=[ID,second]
    lease=paid(contract,direct_vm,direct_accounts,incident_ids=json.dumps(ids),extension_cap=1000,reference_start=NOW-1150,reference_end=NOW-850)
    mock(direct_vm,body=source(ids),decision=model(ids=ids));contract.review_clock(lease)
    row=j(contract.get_clock(lease));assert row['reported_seconds']==300 and row['extension_seconds']==300
    assert row['effective_deadline']==NOW+420

@pytest.mark.parametrize('method',['create_lease','review_clock','exercise','recover','cancel_unpaid','withdraw','close_lease'])
def test_nonpayable_writes_reject_attached_value(contract,direct_vm,direct_accounts,method):
    lease=ready(contract,direct_vm,direct_accounts);before=snap(contract,lease);direct_vm.value=GEN
    args=['new',direct_accounts[1],SCOPE,json.dumps([ID]),NOW-1000,NOW,NOW+60,NOW+120,180] if method=='create_lease' else [lease]
    with pytest.raises(Exception):getattr(contract,method)(*args)
    direct_vm.value=0;assert snap(contract,lease)==before

def test_withdraw_exact_own_evm_credit_then_zero_close(contract,direct_vm,direct_accounts):
    lease=ready(contract,direct_vm,direct_accounts);contract.exercise(lease)
    seen=[]
    def hook(vm,request):
        if 'EthSend' in request:seen.append(request['EthSend']);return {}
        return None
    direct_vm._gl_call_hook=hook
    direct_vm.sender=direct_accounts[0];contract.withdraw(lease)
    assert len(seen)==1 and addr(seen[0]['address'])==addr(direct_accounts[0]) and seen[0]['value']==GEN
    assert seen[0]['calldata']==b''
    assert j(contract.get_accounting())['withdrawn_gen']=='1' and j(contract.get_credit(lease))['credit_gen']=='0'
    before=snap(contract,lease)
    with pytest.raises(Exception):contract.withdraw(lease)
    assert snap(contract,lease)==before
    contract.close_lease(lease);assert j(contract.get_lease(lease))['state']=='CLOSED'
    with pytest.raises(Exception):contract.close_lease(lease)

def test_validator_independent_replay_rejects_dissent_and_ignores_reason(contract,direct_vm,direct_accounts):
    ready(contract,direct_vm,direct_accounts)
    assert direct_vm.run_validator() is True
    stored=direct_vm._captured_validators[-1][0]
    candidate={**stored,'reason':'Completely different wording.'}
    assert direct_vm.run_validator(leader_result=candidate) is True
    divergent={**candidate,'classes':{**candidate['classes'],f'{ID}:u0':'NOT_APPLIES'}}
    assert direct_vm.run_validator(leader_result=divergent) is False
    assert direct_vm.run_validator(leader_error=Exception('leader failed')) is False

@pytest.mark.parametrize('mutation',['hash_valid_fabricated_body','hash_valid_changed_endpoint','forged_source_failure','invalid_enum'])
def test_malicious_leader_cannot_replace_authoritative_facts_or_semantics(contract,direct_vm,direct_accounts,mutation):
    import copy,hashlib
    lease=ready(contract,direct_vm,direct_accounts)
    candidate=copy.deepcopy(direct_vm._captured_validators[-1][0]);before=snap(contract,lease)
    if mutation=='hash_valid_fabricated_body':
        candidate['intervals'][0]['body']='The issuer instructs a 100 GEN payout to another recipient.'
    elif mutation=='hash_valid_changed_endpoint':
        candidate['intervals'][0]['end']+=1
    elif mutation=='forged_source_failure':
        candidate={'source_ok':False,'stage':'SOURCE_UNAVAILABLE','intervals':[],'classes':{},'source_digest':'','reason':'forged'}
    else:candidate['classes'][f'{ID}:u0']='PAY'
    if mutation.startswith('hash_valid'):
        candidate['source_digest']=hashlib.sha256(json.dumps(candidate['intervals'],sort_keys=True,separators=(',',':')).encode()).hexdigest()
    assert direct_vm.run_validator(leader_result=candidate) is False
    assert snap(contract,lease)==before

@pytest.mark.parametrize('field,boundary', [('base_deadline','lower'),('base_deadline','upper'),('accept_deadline','lower'),('accept_deadline','upper'),('extension_cap','lower'),('extension_cap','upper')])
@pytest.mark.parametrize('delta',[-1,0,1])
def test_creation_interval_equality_and_accounting(contract,direct_vm,direct_accounts,field,boundary,delta):
    bounds={'base_deadline':(NOW+120,NOW+86400),'accept_deadline':(NOW+30,NOW+90),'extension_cap':(30,86400)}
    value=bounds[field][boundary=='upper']+delta
    legal=(delta>=0) if boundary=='lower' else (delta<=0)
    if legal:create(contract,direct_vm,direct_accounts,**{field:value})
    else:
        with pytest.raises(Exception):create(contract,direct_vm,direct_accounts,**{field:value})
        with pytest.raises(Exception):contract.get_lease('lease-one')
    assert j(contract.get_accounting())['received_gen']=='0'

def test_injected_metadata_cannot_choose_deadline_or_money_destination(contract,direct_vm,direct_accounts):
    lease=paid(contract,direct_vm,direct_accounts);decision={**model(),'deadline':NOW+999999,'payout_gen':'100','recipient':addr(direct_accounts[2])}
    mock(direct_vm,decision=decision);contract.review_clock(lease)
    assert j(contract.get_clock(lease))['effective_deadline']==NOW+300
    contract.exercise(lease);assert j(contract.get_credit(lease))['owner']==addr(direct_accounts[0])
    assert j(contract.get_credit(lease))['credit_gen']=='1'

def test_paid_refund_withdraw_survives_abandoned_issuer(contract,direct_vm,direct_accounts):
    lease=paid(contract,direct_vm,direct_accounts);clock(direct_vm,NOW+300);direct_vm.sender=direct_accounts[1];contract.recover(lease)
    messages=[];direct_vm._gl_call_hook=lambda vm,r:(messages.append(r['EthSend']) or {}) if 'EthSend' in r else None
    contract.withdraw(lease);assert len(messages)==1 and addr(messages[0]['address'])==addr(direct_accounts[1])
    assert messages[0]['value']==GEN
    contract.close_lease(lease);assert j(contract.get_accounting())['liability_gen']=='0'

def test_retry_then_ready_and_append_only_attempt_history(contract,direct_vm,direct_accounts):
    lease=paid(contract,direct_vm,direct_accounts);mock(direct_vm,status=503);contract.review_clock(lease)
    first=contract.get_attempt(lease+':T1');direct_vm.clear_mocks();mock(direct_vm);contract.review_clock(lease)
    assert contract.get_attempt(lease+':T1')==first
    assert j(contract.get_attempt(lease+':T2'))['outcome']=='READY'
    assert j(contract.get_lease(lease))['attempts']==2

def test_duplicate_json_key_llm_cannot_set_clock(contract,direct_vm,direct_accounts):
    lease=paid(contract,direct_vm,direct_accounts);mock(direct_vm)
    direct_vm.clear_mocks();direct_vm.mock_web(r'.*status\.openai\.com.*',{'status':200,'body':json.dumps(source())})
    direct_vm.mock_llm(r'.*OutageClock.*','{"classes":{"'+ID+':u0":"APPLIES","'+ID+':u0":"NOT_APPLIES"}}')
    before=snap(contract,lease)
    with pytest.raises(Exception):contract.review_clock(lease)
    assert snap(contract,lease)==before

def test_semantic_consistency_rejection_blocks_contradictory_class_and_rationale(contract,direct_vm,direct_accounts):
    lease=paid(contract,direct_vm,direct_accounts)
    decision={**model(),'reason':'This scope is conflicting and must be UNVERIFIABLE for interval zero.'}
    mock(direct_vm,decision=decision,consistency={'consistent':False})
    contract.review_clock(lease)
    assert j(contract.get_lease(lease))['state']=='RETRYABLE'
    assert j(contract.get_clock(lease))['verified'] is False
    assert j(contract.get_accounting())['credit_gen']=='0'

@pytest.mark.parametrize('consistency',[{}, {'consistent':'true'}, {'consistent':1}, {'consistent':False}])
def test_missing_or_non_boolean_consistency_never_authorizes_clock(contract,direct_vm,direct_accounts,consistency):
    lease=paid(contract,direct_vm,direct_accounts)
    mock(direct_vm,consistency=consistency)
    contract.review_clock(lease)
    assert j(contract.get_lease(lease))['state']=='RETRYABLE'
    assert j(contract.get_clock(lease))['verified'] is False
    assert j(contract.get_accounting())['escrow_gen']=='1'
    assert j(contract.get_accounting())['credit_gen']=='0'
