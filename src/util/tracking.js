const COURIER_URLS = {
  'Delhivery': (t) => `https://www.delhivery.com/track/package/${t}`,
  'Blue Dart': (t) => `https://www.bluedart.com/tracking?${t}`,
  'DTDC': (t) => `https://www.dtdc.in/track/tracking_results.asp?ttype=awb&trcno=${t}`,
  'India Post': (t) => `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?ConsignmentNumber=${t}`,
  'Ekart': (t) => `https://ekartlogistics.com/track/${t}`,
  'XpressBees': (t) => `https://www.xpressbees.com/tracking?awb=${t}`,
  'Shiprocket': (t) => `https://shiprocket.co/tracking/${t}`,
  'Amazon Shipping': (t) => `https://track.amazon.in/track/${t}`,
  'Other': (t) => `https://www.google.com/search?q=track+package+${t}`
};

export function getTrackingUrl(trackingNumber, courier) {
  const urlFn = COURIER_URLS[courier] || COURIER_URLS['Other'];
  return urlFn(encodeURIComponent(trackingNumber));
}

export const COURIER_OPTIONS = Object.keys(COURIER_URLS);
