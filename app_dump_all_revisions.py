from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC # available since 2.26.0
import requests, re, time, os, json, sys, getopt
from tetpyclient import RestClient

# Create a new instance of the Firefox driver
driver = webdriver.Firefox()

def dump_application_revisions( endpoint):
    restclient = RestClient( endpoint +'/',
                    credentials_file='api_cred.json',
                    verify=False)
    apps = []
    resp = restclient.get('/applications')
    if resp.status_code == 200 :
        respbody = json.loads(resp.text)
        with open('public/data/all.json', 'w+') as appf:
            appf.write( resp.text)
            respbody = json.loads( resp.text)
            for app in respbody:
                appnames = {}
                appnames['id'] = str(app['id'])
                appnames['name'] = str(app['name'])
                #version changed after 2.3+
                try:
                    appnames['version'] = str(app['version'])
                except KeyError as ke:
                    appnames['version'] = str(app['latest_adm_version'])
                apps.append( appnames)


    # go to the tetration login page
    driver.get(endpoint)
    ids = ['h4_user_email', 'h4_user_password']
    #vals = ['hyungsok@cpocsyd.local', 'J|{Di6dV02l']
    vals = ['hyungsok@cisco.com', '1234Qwer']
    for idx, eid in enumerate(ids):
        element = driver.find_element_by_id( eid) 
        element.send_keys( vals[idx])
    submit_btn = driver.find_element_by_name('commit')
    submit_btn.click()
    # just give a time to get data
    time.sleep(10)

    el = driver.find_element_by_name('csrf-token')
    newheader = {'X-CSRF-Token': el.get_attribute('content'), 'Referer': endpoint +'/'}
    scookie = driver.get_cookies()
    newcookies = {}
    for x in scookie:
        newcookies[ x['name']] = x['value']
    payload= {'clusters_only': 'false'}
    # extract all revision data fro each application 
    for app in apps:
        for x in range(1, int(app['version'])):
            resp = requests.post('{0}/api/data_sets/{1}/download.json?version={2}'.format(endpoint, app['id'], x), headers = newheader, cookies=newcookies, json=payload, verify=False)
            newcookies = resp.cookies 
            json_body = resp.json()
            with open('public/data/{0}/{1}.json'.format(app['id'], x), "w+") as outf:
                outf.write( json.dumps(json_body))

if __name__ == '__main__':
    # Read command line args
    endpoint = None
    myopts, args = getopt.getopt(sys.argv[1:],"h:")
    for o, a in myopts:
        if o == '-h':
            if not a.startswith('http') :
                endpoint = 'https://' + a
            else:
                endpoint = a
        else:
            print("Usage : {0} -h https://{{tetration-ip-address}} ".format( sys.argv[0]))
            sys.exit(0)
    if endpoint :
        print("tetration cluster ip is {0}".format( endpoint))
        dump_application_revisions( endpoint)
    else:
        print("Usage : {0} -h https://{{tetration-ip-address}}".format( sys.argv[0]))
        sys.exit(0)
    