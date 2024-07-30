import * as IpAddresses from "../../src/ts/utils/ip-addresses";

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
      ];
      const compressedIps = [
        "::1:0:0:0",
        "b70b:ad23:3d4b:23a9:8000::",
        "ad69:5:2a4:a8a9:5dae:55f4:d87a:0",
        "::1:2:0:0:0",
        "::",
        "2001:db8::2:1",
        "2001:db8:0:1:1:1:1:1",
      ];

      for (let i = 0; i < rawIps.length; i++) {
        expect(IpAddresses.compressIpv6(rawIps[i] as string)).toEqual(
          compressedIps[i]
        );
      }
    });
  });
});
