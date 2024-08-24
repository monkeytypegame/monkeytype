import * as IpAddresses from "../../src/ts/utils/ip-addresses";

const IP_GENERATE_COUNT = 1000;

describe("IP Addresses", () => {
  describe("Compressing IPv6", () => {
    it("should compress ipv6 according to the official rules", () => {
      const rawIps = [
        "0000:0000:0000:0000:0001:0000:0000:0000",
        "b70b:ad23:3d4b:23a9:8000:0000:0000:0000",
        "ad69:0005:02a4:a8a9:5dae:55f4:d87a:0000",
        "0000:0000:0000:0001:0002:0000:0000:0000",
        "0000:0000:0000:0000:0000:0000:0000:0000",
        "2001:db8:0:0:0:0:2:1",
        "2001:db8:0000:1:1:1:1:1",
        "9ffd:7895:b4ae:36f6:b50a:8300:0000:0000/88",
      ];
      const compressedIps = [
        "::1:0:0:0",
        "b70b:ad23:3d4b:23a9:8000::",
        "ad69:5:2a4:a8a9:5dae:55f4:d87a:0",
        "::1:2:0:0:0",
        "::",
        "2001:db8::2:1",
        "2001:db8:0:1:1:1:1:1",
        "9ffd:7895:b4ae:36f6:b50a:8300::/88",
      ];

      for (let i = 0; i < rawIps.length; i++) {
        expect(IpAddresses.compressIpv6(rawIps[i] as string)).toEqual(
          compressedIps[i]
        );
      }
    });
  });

  describe("Generating IPv4", () => {
    it("should generate valid IPv4 addresses", () => {
      // We generate a set number of ip addresses dictated by the constant
      for (let i = 0; i < IP_GENERATE_COUNT; i++) {
        const ipAddress = IpAddresses.getRandomIPv4address();
        const splitIpAddress = ipAddress.split(".");

        expect(splitIpAddress.length, "Make sure there are four parts").toEqual(
          4
        );

        for (let j = 0; j < 4; j++) {
          const currentNumber = Number(splitIpAddress[j]);
          expect(
            currentNumber,
            "Each part of an IPv4 should be >= 0"
          ).toBeGreaterThanOrEqual(0);
          expect(
            currentNumber,
            "Each part of an IPv4 should be <= 255"
          ).toBeLessThanOrEqual(255);
        }
      }
    });
  });

  describe("Generating IPv6", () => {
    it("should generate valid IPv6 addresses", () => {
      for (let i = 0; i < IP_GENERATE_COUNT; i++) {
        const ipAddress = IpAddresses.getRandomIPv6address();
        const splitIpAddress = ipAddress.split(":");

        expect(
          splitIpAddress.length,
          "Make sure there are eight parts"
        ).toEqual(8);

        for (let j = 0; j < 8; j++) {
          const currentPart = splitIpAddress[j] as string;
          expect(
            currentPart.length,
            "Each part of an IPv6 should be between 1 and 4 characters"
          ).toBeGreaterThanOrEqual(1);
          expect(
            currentPart.length,
            "Each part of an IPv6 should be between 1 and 4 characters"
          ).toBeLessThanOrEqual(4);

          const currentNumber = parseInt(currentPart, 16);
          expect(
            currentNumber,
            "Each part of an IPv6 should be a valid hexadecimal number"
          ).not.toBeNaN();
          expect(
            currentNumber,
            "Each part of an IPv6 should be >= 0"
          ).toBeGreaterThanOrEqual(0);
          expect(
            currentNumber,
            "Each part of an IPv6 should be <= 65535"
          ).toBeLessThanOrEqual(65535);
        }
      }
    });
  });

  describe("Address to CIDR", () => {
    it("should convert an IPv4 address to CIDR notation", () => {
      const ip = "192.168.1.1";
      const cidr = IpAddresses.addressToCIDR(ip);
      const ipParts = cidr.split("/");
      expect(
        ipParts.length,
        "There should only be one '/' in the ip addresss"
      ).toEqual(2);
      const maskSize = Number(ipParts[1]);
      expect(maskSize).not.toBeNaN();
      expect(maskSize).toBeGreaterThanOrEqual(0);
      expect(maskSize).toBeLessThanOrEqual(32);
    });

    it("should convert an IPv6 address to CIDR notation", () => {
      const ip = "b70b:ad23:3d4b:23a9:8000:0000:0000:0000";
      const cidr = IpAddresses.addressToCIDR(ip);
      const ipParts = cidr.split("/");
      expect(
        ipParts.length,
        "There should only be one '/' in the ip addresss"
      ).toEqual(2);
      console.log(cidr);
      const maskSize = Number(ipParts[1]);
      expect(maskSize).not.toBeNaN();
      expect(maskSize).toBeGreaterThanOrEqual(1);
      expect(maskSize).toBeLessThanOrEqual(128);
    });
  });
});
