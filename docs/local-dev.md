
# Testing Wildcard domains locally

Wildcard domains are pretty neat. When defined they look like `*.example.com`. But what they really do is quite special. They now allow

- `a.example.com`
- `ab.example.com`
- `abc.example.com`
- `abcd.example.com`
- etc

The names can get **HUGE**. If you want to see an example in action, you can try out [ngrok](https://ngrok.com/) with a local server. Easy to use and you get your own website to test out in the public.

I had to go through a bunch of websites that basically told be to do what I'm going to tell you to do. But for some reason, none of it was working. Thus I remade the wheel in case anyone else runs into troubles like i did. Btw, just because you uninstall a brew doesn't mean the service it runs stops. I ended having to use `launchctl remove homebrew.mxcl.dnsmasq` to ensure it stopped running since everytime i tried using `launchctl stop homebrew.mxcl.dnsmasq` it just restarted. The whole thing was a mess. Fortunately, things seem to be working pretty great now.

You can use any domain you want. For my purposes I want the subdmain under `dev.localhost.test`. Not the domain itself but right under it. This is achievable with wildcard subdomains. Unfortunately dnsmasq seems to resolve the domain and *everything* under that domain. That includes

- no - `dev.localhost.test`
- ok - `a.dev.localhost.test`
- no - `a.b.dev.localhost.test`
- no - `a.b.c.dev.localhost.test`
- etc

I think you get the idea. But because I am pretty sure unlimited subdomains won't happen on my server I don't have to test for them. Additionally, the domain itself shouldn't get hit so I won't worry about that either.

#### Setps
- install dnsmasq
  - for macs `brew install dnsmasq`
  - not sure for linux but i don't think it will be an issue
- go to the directory that dnsmasq should resolve
  - for mac `/usr/local/etc/dnsmasq.d`
- create any file that ends with `.conf`
  - I named mine `dev.localhost.test.conf`
- in that file add `address=/dev.localhost.test/127.0.0.1`
- create a file in `/etc/resolver/dev.localhost.test`
  - here you need to be explicit about the hostname
  - you also need sudo to create it and edit it
- in that file add `nameserver 127.0.0.1`
- restart dnsmasq
  - for mac `sudo brew services restart dnsmasq`
- curl `a.nested.subdomain.dev.localhost.test:$YOUR_SERVER_PORT`
  - should return the expected result


### Do it again just to make sure you get it
- only this time for a top level domain
  - for me that was `kawaii`

### Do it again only more 1337
- `echo "address=/poop/127.0.0.1" > /usr/local/etc/dnsmasq.d/poop.conf`
- `sudo sh -c 'echo "nameserver 127.0.0.1" > /etc/resolver/poop'`
- check your work with `cat`
- restart dnsmasq - `sudo brew services restart dnsmasq`

### Some notes
- dig doesn't seem to work for me but curl does
- For mac (at least mine), you need both ther `.conf` and `resolver` files. Not sure about linux
- Heres my operating system specs. Each operating system may be different.
```
ProductName:	macOS
ProductVersion:	11.6.2
BuildVersion:	20G314
```


### Some notes
- Everything under the specified domain is handled
  - this is not how real world domains work
    - https://security.stackexchange.com/questions/37887/why-arent-infinite-depth-wildcard-certificates-allowed
    - i believe this is specific to dnsmasq
  - examples
    - z.dev.localhost.kawaii
    - i.am.very.deep.dev.localhost.kawaii
- before setting a top level domain (or any domain for that matter), you may want to ensure it is not being used in the real world
  - https://www.namecheap.com/domains/full-tld-list/?gclid=Cj0KCQiArt6PBhCoARIsAMF5waggCyjSh-a2It41EmyrURJD_DS7RLhrlPQqj0QNQi8IueMxpZkCZqAaAjFFEALw_wcB
  - A common top level domain if `.dev` but that is now owned by google
    - https://domains.google/tld/dev/
  - the domains `.test`, `.kawaii` and `.poop` don't seem to be used in the wild yet
    - but who know the future? `.test` seems ripe, the other two who knows
  - I was originally going to use `dev.localhost.me`
    - but localhost.me is real website
    - it doesn't seem used much but i don't want to use something that really exists
