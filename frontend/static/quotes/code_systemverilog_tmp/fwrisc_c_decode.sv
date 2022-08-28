module fwrisc_c_decode(
    input clock,
    input reset,
    input[15:0] instr_i,
    output reg[31:0] instr);
    parameter [6:0]
        OPCODE_OP_IMM = 7'b0010011,
        OPCODE_LOAD = 7'b0000011,
        OPCODE_JAL = 7'b1101111,
        OPCODE_LUI = 7'b0110111,
        OPCODE_OP = 7'b0110011,
        OPCODE_BRANCH = 7'b1100011,
        OPCODE_JALR = 7'b1100111,
        OPCODE_STORE = 7'b0100011;
    always @* begin
        instr = 0;
        case (instr_i[1:0])
            2'b00: begin
                case (instr_i[15:13])
                    3'b000: begin
                        instr = {2'b0, instr_i[10:7], instr_i[12:11], instr_i[5],
                                instr_i[6], 2'b00, 5'h02, 3'b000, 2'b01, instr_i[4:2], {OPCODE_OP_IMM}};
                    end
                    3'b010: begin
                        instr = {5'b0, instr_i[5], instr_i[12:10], instr_i[6],
                                2'b00, 2'b01, instr_i[9:7], 3'b010, 2'b01, instr_i[4:2], {OPCODE_LOAD}};
                    end
                    3'b110: begin
                        instr = {5'b0, instr_i[5], instr_i[12], 2'b01, instr_i[4:2],
                                2'b01, instr_i[9:7], 3'b010, instr_i[11:10], instr_i[6],
                                2'b00, {OPCODE_STORE}};
                    end
                endcase
            end
            2'b01: begin
                case (instr_i[15:13])
                    3'b000: begin
                        instr = {{6 {instr_i[12]}}, instr_i[12], instr_i[6:2],
                                instr_i[11:7], 3'b0, instr_i[11:7], {OPCODE_OP_IMM}};
                    end

                    3'b001, 3'b101: begin
                        instr = {instr_i[12], instr_i[8], instr_i[10:9], instr_i[6],
                                instr_i[7], instr_i[2], instr_i[11], instr_i[5:3],
                                {9 {instr_i[12]}}, 4'b0, ~instr_i[15], {OPCODE_JAL}};
                    end
                    3'b010: begin
                        instr = {{6 {instr_i[12]}}, instr_i[12], instr_i[6:2], 5'b0,
                                3'b0, instr_i[11:7], {OPCODE_OP_IMM}};
                    end
                    3'b011: begin
                        instr = {{15 {instr_i[12]}}, instr_i[6:2], instr_i[11:7], {OPCODE_LUI}};
                        if (instr_i[11:7] == 5'h02) begin
                            instr = {{3 {instr_i[12]}}, instr_i[4:3], instr_i[5], instr_i[2],
                                    instr_i[6], 4'b0, 5'h02, 3'b000, 5'h02, {OPCODE_OP_IMM}};
                        end
                    end
                    3'b100: begin
                        case (instr_i[11:10])
                            2'b00,
                            2'b01: begin
                                instr = {1'b0, instr_i[10], 5'b0, instr_i[6:2], 2'b01, instr_i[9:7],
                                        3'b101, 2'b01, instr_i[9:7], {OPCODE_OP_IMM}};
                            end
                            2'b10: begin
                                instr = {{6 {instr_i[12]}}, instr_i[12], instr_i[6:2], 2'b01, instr_i[9:7],
                                        3'b111, 2'b01, instr_i[9:7], {OPCODE_OP_IMM}};
                            end
                            2'b11: begin
                                case ({instr_i[12], instr_i[6:5]})
                                    3'b000: begin
                                        instr = {2'b01, 5'b0, 2'b01, instr_i[4:2], 2'b01, instr_i[9:7],
                                                3'b000, 2'b01, instr_i[9:7], {OPCODE_OP}};
                                    end
                                    3'b001: begin
                                        instr = {7'b0, 2'b01, instr_i[4:2], 2'b01, instr_i[9:7], 3'b100,
                                                2'b01, instr_i[9:7], {OPCODE_OP}};
                                    end
                                    3'b010: begin
                                        instr = {7'b0, 2'b01, instr_i[4:2], 2'b01, instr_i[9:7], 3'b110,
                                                2'b01, instr_i[9:7], {OPCODE_OP}};
                                    end
                                    3'b011: begin
                                        instr = {7'b0, 2'b01, instr_i[4:2], 2'b01, instr_i[9:7], 3'b111,
                                                2'b01, instr_i[9:7], {OPCODE_OP}};
                                    end
                                endcase
                            end
                        endcase
                    end
                    3'b110, 3'b111: begin
                        instr = {{4 {instr_i[12]}}, instr_i[6:5], instr_i[2], 5'b0, 2'b01,
                                instr_i[9:7], 2'b00, instr_i[13], instr_i[11:10], instr_i[4:3],
                                instr_i[12], {OPCODE_BRANCH}};
                    end
                endcase
            end
            2'b10: begin
                case (instr_i[15:13])
                    3'b000: begin
                        instr = {7'b0, instr_i[6:2], instr_i[11:7], 3'b001, instr_i[11:7], {OPCODE_OP_IMM}};
                    end
                    3'b010: begin
                        instr = {4'b0, instr_i[3:2], instr_i[12], instr_i[6:4], 2'b00, 5'h02,
                                3'b010, instr_i[11:7], OPCODE_LOAD};
                    end
                    3'b100: begin
                        if (instr_i[12] == 1'b0) begin
                            if (instr_i[6:2] != 5'b0) begin
                                instr = {7'b0, instr_i[6:2], 5'b0, 3'b0, instr_i[11:7], {OPCODE_OP}};
                            end else begin
                                instr = {12'b0, instr_i[11:7], 3'b0, 5'b0, {OPCODE_JALR}};
                            end
                        end else begin
                            if (instr_i[6:2] != 5'b0) begin
                                instr = {7'b0, instr_i[6:2], instr_i[11:7], 3'b0, instr_i[11:7], {OPCODE_OP}};
                            end else begin
                                if (instr_i[11:7] == 5'b0) begin
                                    instr = {32'h00_10_00_73};
                                end else begin
                                    instr = {12'b0, instr_i[11:7], 3'b000, 5'b00001, {OPCODE_JALR}};
                                end
                            end
                        end
                    end
                    3'b110: begin
                        instr = {4'b0, instr_i[8:7], instr_i[12], instr_i[6:2], 5'h02, 3'b010,
                                instr_i[11:9], 2'b00, {OPCODE_STORE}};
                    end
                endcase
            end
            default: begin
                instr = instr_i;
            end
        endcase
    end
endmodule