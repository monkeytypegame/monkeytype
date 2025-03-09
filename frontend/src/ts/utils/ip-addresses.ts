import { randomIntFromRange } from "@monkeytype/util/numbers";

function getRandomIPvXaddress(
  bits: number,
  parts: number,
  base: number,
  pad: boolean,
  separator: string
): string {
  const addr: string[] = [];
  const b = Math.round(bits / parts);
  for (let i = 0; i < parts; i++) {
    const n = randomIntFromRange(0, 2 ** b - 1);
    let part = n.toString(base);
    if (pad) {
      const width = Math.ceil(b / Math.ceil(Math.log2(base)));
      part = "0".repeat(Math.max(0, width - part.length)) + part;
    }
    addr.push(part);
  }
  return addr.join(separator);
}

function getIPCidr(
  bits: number,
  parts: number,
  base: number,
  separator: string,
  address: string,
  maskSize: number
): string {
  const addr = address.split(separator).map((a) => parseInt(a, base));
  const b = Math.round(bits / parts);
  let bitsLeft = maskSize;
  for (let i = 0; i < parts; i++) {
    bitsLeft -= b;
    if (bitsLeft < 0) {
      if (-bitsLeft <= b) {
        (addr[i] as number) &= (2 ** b - 1) ^ (2 ** -bitsLeft - 1);
      } else {
        addr[i] = 0;
      }
    }
  }
  return (
    addr.map((a) => a.toString(base)).join(separator) +
    "/" +
    maskSize.toString()
  );
}

export function getRandomIPv4address(): string {
  return getRandomIPvXaddress(32, 4, 10, false, ".");
}

export function getRandomIPv6address(): string {
  return getRandomIPvXaddress(128, 8, 16, true, ":");
}

export function addressToCIDR(addr: string): string {
  if (addr.includes(":")) {
    return getIPCidr(128, 8, 16, ":", addr, randomIntFromRange(16, 32) * 4);
  } else {
    return getIPCidr(32, 4, 10, ".", addr, randomIntFromRange(8, 32));
  }
}

export function compressIpv6(ip: string): string {
  const ipPortSplit = ip.split("/");
  let ipArray = (ipPortSplit[0] as string).split(":");
  let newIp = "";

  // Replace the leading zeros using regex
  ipArray = ipArray.map((word) => word.replace(/^0+/gm, ""));

  // Find the longest series of zeros
  let longestSeriesNum = 0,
    longestStartIndex = -1,
    longestEndIndex = -1;
  let currentSeriesNum = 0,
    currentStartIndex = -1,
    currentEndIndex = -1;

  for (let i = 0; i < ipArray.length; i++) {
    if (ipArray[i] === "") {
      if (currentStartIndex === -1) currentStartIndex = i;
      currentSeriesNum++;
    } else {
      // The last empty index was the previous one
      currentEndIndex = i - 1;

      if (longestSeriesNum < currentSeriesNum) {
        longestSeriesNum = currentSeriesNum;
        longestStartIndex = currentStartIndex;
        longestEndIndex = currentEndIndex;
      }

      // Reset the values
      currentSeriesNum = 0;
      currentStartIndex = -1;
      currentEndIndex = -1;
    }
  }

  if (longestSeriesNum < currentSeriesNum) {
    longestSeriesNum = currentSeriesNum;
    longestStartIndex = currentStartIndex;
    longestEndIndex = ipArray.length - 1;
  }

  // Fill in zeroes in all places except within and including the start and end indexes
  // In those indexes, use a ':'

  ipArray = ipArray.map((word, index) => {
    if (word === "") {
      // If the index is within those indexes and that this is not a single 16bit zero field
      if (
        index >= longestStartIndex &&
        index <= longestEndIndex &&
        longestStartIndex !== longestEndIndex
      )
        return ":";
      else return "0";
    }

    return word;
  });

  newIp = ipArray.join(":");
  // Replace multiple colons with a double colon.
  // This should occur only once
  newIp = newIp.replace(/:{3,}/gm, "::");

  if (ipPortSplit.length > 1) {
    // The IP has a port. Add it back
    newIp += "/" + ipPortSplit[1];
  }

  return newIp;
}
