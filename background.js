function listener(details) 
{ 
  const del = ';';
  const url = new URL(details.url);  
  if (!url.pathname == 'infocelltowers.ru') return null;
  if (!url.pathname.startsWith("/ymaps")) return null;
  if (details.method != 'POST') return null;
  console.log(details.url);
  
  let filter = browser.webRequest.filterResponseData(details.requestId);
  let decoder = new TextDecoder("utf-8");
  let encoder = new TextEncoder();  
  let allData = "";

  filter.ondata = event =>
  {	
    let str = decoder.decode(event.data, {stream: true});      
	allData += str;
	filter.write(encoder.encode(str));
  };
  
  filter.onstop  = (event) =>
  {
		filter.close();
		try
		{
			var documentJson = JSON.parse(allData);
			if (typeof documentJson.type != 'undefined' && documentJson.type == 'FeatureCollection' && typeof documentJson.features != 'undefined' && documentJson.features.length > 0)
			{
				var minmax = [NaN,NaN,NaN,NaN];
				var hdr = ['id','lat','lon','caption','name','description','style'];
				var txt = 'num' + del + hdr.join(del) + del + '<br/>\r\n';
				var empty = []; hdr.forEach((e) => empty.push(''));
				empty = empty.join(";") + del + '<br/>\r\n';
				for(var i = 0; i < documentJson.features.length; i++)
				{
					if (typeof documentJson.features[i].type == 'undefined' || documentJson.features[i].type != 'Feature') continue;
					txt += i + del;
					txt += documentJson.features[i].id + del;
					txt += documentJson.features[i].geometry.coordinates[0] + del;
					txt += documentJson.features[i].geometry.coordinates[1] + del;
					txt += documentJson.features[i].properties.hintContent + del;
					txt += documentJson.features[i].properties.balloonContentHeader.replace(/<[^>]*>?/gm, '') + del;
					txt += documentJson.features[i].properties.balloonContentBody + del;
					txt += documentJson.features[i].options.preset + del;
					txt += '<br/>\r\n';
					try 
					{
						let y = parseFloat(documentJson.features[i].geometry.coordinates[0]);
						let x = parseFloat(documentJson.features[i].geometry.coordinates[1]);
						if (isNaN(minmax[0])) minmax[0] = y; else if (y > minmax[0]) minmax[0] = y + 0.000001;
						if (isNaN(minmax[2])) minmax[2] = y; else if (y < minmax[2]) minmax[2] = y - 0.000001;						
						if (isNaN(minmax[1])) minmax[1] = x; else if (x < minmax[1]) minmax[1] = x - 0.000001;
						if (isNaN(minmax[3])) minmax[3] = x; else if (x > minmax[3]) minmax[3] = x + 0.000001;
					} 
					catch {};
				};
				txt += 'URL: ' + details.url + del + empty;
				txt += 'Copyrights (c) https://github.com/dkxce' + del + empty;
				// console.log(txt); // document.write(txt);
				let blob = URL.createObjectURL(new Blob([txt], { type: "text/csv" }));

				let sp = url.searchParams;
				let fileName = 'ICT_(' + minmax[0].toString().substring(0,9) + ',' + minmax[1].toString().substring(0,9) + ';' + minmax[2].toString().substring(0,10) + ',' + minmax[3].toString().substring(0,10)+')';
				
				var a = document.createElement("a"); a.style = "display:none;"; a.href = blob; a.download = fileName + ".csv"; 
				document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(blob);
				
				//var creating = browser.tabs.create({url: blob, active: false});	
				//creating.then((tab) => setTimeout(() => browser.tabs.remove(tab.id), 1000), null);
			};		
		}
		catch (e) { console.log(e); };
  };
  
  return null;
}

browser.webRequest.onBeforeRequest.addListener( listener, {urls: ["https://*/*","http://*/*"]}, ["blocking","requestBody"] );
