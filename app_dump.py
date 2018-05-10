from tetpyclient import RestClient
import pprint
import json
import os, sys, getopt

# ``verify`` is an optional param to disable SSL server authentication.
# By default, Tetration appliance dashboard IP uses self signed cert after
# deployment. Hence, ``verify=False`` might be used to disable server
# authentication in SSL for API clients. If users upload their own
# certificate to Tetration appliance (from ``Settings > Company`` Tab)
# which is signed by their enterprise CA, then server side authentication
# should be enabled.
# credentials.json looks like:
# {
#   "api_key": "<hex string>",
#   "api_secret": "<hex string>"
# }


def dump_applications( endpoint):
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

    for app in apps:
        resp = restclient.get('/applications/%s/details' %(app['id']))
        if resp.status_code == 200:
            try:
                os.mkdir('public/data/%s' %(app['id']))
            except:
                pass
            with open('public/data/%s.json' %(app['id']), "w+") as outf:
                outf.write( resp.text)
            with open('public/data/%s/%s.json' %(app['id'], app['version']), "w+") as outf2:
                outf2.write( resp.text)


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
        print("tetration cluster is {0}".format( endpoint))
        dump_applications( endpoint)
    else:
        print("Usage : {0} -h https://{{tetration-ip-address}}".format( sys.argv[0]))
        sys.exit(0)