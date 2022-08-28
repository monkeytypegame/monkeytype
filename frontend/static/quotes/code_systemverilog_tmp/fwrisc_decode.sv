module fwrisc_decode #(
    parameter ENABLE_COMPRESSED=1
    )(
    input clock,
    input reset,
    input fetch_valid,
    output decode_complete,
    input[31:0] instr_i,
    input instr_c,
    input[31:0] pc,
    output reg[5:0] ra_raddr,
    input[31:0] ra_rdata,
    output reg[5:0] rb_raddr,
    input[31:0] rb_rdata,
    output decode_valid,
    input exec_complete,
    output reg[31:0] op_a,
    output reg[31:0] op_b,
    output reg[31:0] op_c,
    output[3:0] op,
    output reg[5:0] rd_raddr,
    output reg[4:0] op_type);
    parameter [4:0]
        OP_TYPE_ARITH = 5'd0,
        OP_TYPE_BRANCH = (OP_TYPE_ARITH+5'd1),
        OP_TYPE_LDST = (OP_TYPE_BRANCH+5'd1),
        OP_TYPE_MDS = (OP_TYPE_LDST+5'd1),
        OP_TYPE_JUMP = (OP_TYPE_MDS+5'd1),
        OP_TYPE_SYSTEM = (OP_TYPE_JUMP+5'd1),
        OP_TYPE_CSR = (OP_TYPE_SYSTEM+5'd1);
    parameter [3:0]
        OP_ADD = 4'd0,
        OP_SUB = (OP_ADD+4'd1),
        OP_AND = (OP_SUB+4'd1),
        OP_OR = (OP_AND+4'd1),
        OP_CLR = (OP_OR+4'd1),
        OP_EQ = (OP_CLR+4'd1),
        OP_NE = (OP_EQ+4'd1),
        OP_LT = (OP_NE+4'd1),
        OP_GE = (OP_LT+4'd1),
        OP_LTU = (OP_GE+4'd1),
        OP_GEU = (OP_LTU+4'd1),
        OP_OPA = (OP_GEU+4'd1),
        OP_OPB = (OP_OPA+4'd1),
        OP_XOR = (OP_OPB+4'd1);
    parameter [3:0]
        OP_SLL = 4'd0,
        OP_SRL = (OP_SLL + 4'd1),
        OP_SRA = (OP_SRL + 4'd1),
        OP_MUL = (OP_SRA + 4'd1),
        OP_MULH = (OP_MUL + 4'd1),
        OP_MULS = (OP_MULH + 4'd1),
        OP_MULSH = (OP_MULS + 4'd1),
        OP_DIV = (OP_MULSH + 4'd1),
        OP_REM = (OP_DIV + 4'd1),
        OP_NUM_MDS = (OP_REM + 4'd1);
    parameter [3:0]
        OP_LB = 4'd0,
        OP_LH = (OP_LB+4'd1),
        OP_LW = (OP_LH+4'd1),
        OP_LBU = (OP_LW+4'd1),
        OP_LHU = (OP_LBU+4'd1),
        OP_SB = (OP_LHU + 4'd1),
        OP_SH = (OP_SB + 4'd1),
        OP_SW = (OP_SH + 4'd1),
        OP_NUM_MEM = (OP_SW + 4'd1);
    parameter [5:0]
        CSR_BASE_Q0 = 6'h20,
        CSR_MVENDORID = (CSR_BASE_Q0 + 1'd1),
        CSR_MARCHID = (CSR_MVENDORID + 1'd1),
        CSR_MIMPID = (CSR_MARCHID + 1'd1),
        CSR_MHARTID = (CSR_MIMPID + 1'd1),
        CSR_BASE_Q1 = 6'h28,
        CSR_MSTATUS = (CSR_BASE_Q1 + 1'd0),
        CSR_MISA = (CSR_MSTATUS + 1'd1),
        CSR_MEDELEG = (CSR_MISA + 1'd1),
        CSR_MIDELEG = (CSR_MEDELEG + 1'd1),
        CSR_MIE = (CSR_MIDELEG + 1'd1),
        CSR_MTVEC = (CSR_MIE + 1'd1),
        CSR_MCOUNTEREN = (CSR_MTVEC + 1'd1),
        CSR_BASE_Q2 = 6'h30,
        CSR_MSCRATCH = (CSR_BASE_Q2 + 1'd0),
        CSR_MEPC = (CSR_MSCRATCH + 1'd1),
        CSR_MCAUSE = (CSR_MEPC + 1'd1),
        CSR_MTVAL = (CSR_MCAUSE + 1'd1),
        CSR_MIP = (CSR_MTVAL + 1'd1),
        CSR_BASE_Q3 = 6'h38,
        CSR_MCYCLE = (CSR_BASE_Q3 + 1'd0),
        CSR_MCYCLEH = (CSR_MCYCLE + 1'd1),
        CSR_MINSTRET = (CSR_MCYCLEH + 1'd1),
        CSR_MINSTRETH = (CSR_MINSTRET + 1'd1),
        CSR_DEP_LO = (CSR_MINSTRETH + 1'd1),
        CSR_DEP_HI = (CSR_DEP_LO + 1'd1),
        CSR_SOFT_RESET = (CSR_DEP_HI + 1'd1);
    parameter [3:0]
        OP_TYPE_ECALL = 1'd0,
        OP_TYPE_EBREAK = (OP_TYPE_ECALL + 1'd1),
        OP_TYPE_ERET = (OP_TYPE_EBREAK + 1'd1);
    wire[31:0] instr;
    wire[31:0] imm_jump = $signed({instr[31], instr[19:12], instr[20], instr[30:21],1'b0});
    wire[31:0] auipc_imm_31_12 = {instr[31:12], {12{1'b0}}};
    wire[31:0] imm_11_0 = $signed({instr[31:20]});
    wire[31:0] st_imm_11_0 = $signed({instr[31:25], instr[11:7]});
    reg[31:0] imm_lui;
    wire[31:0] imm_branch = $signed({instr[31], instr[7], instr[30:25], instr[11:8], 1'b0});
    reg[4:0] op_type_w;
    reg[3:0] op_w;
    reg decode_valid_r;
    generate
        if (ENABLE_COMPRESSED) begin
            wire [31:0] instr_exp;
            fwrisc_c_decode u_c_decode (
                .clock    (clock), 
                .reset    (reset), 
                .instr_i  (instr_i[15:0]), 
                .instr    (instr_exp));
            assign instr = (instr_c)?instr_exp:instr_i;
        end else begin
            assign instr = instr_i;
        end
    endgenerate
    parameter[3:0]
        I_TYPE_R = 4'd0,
        I_TYPE_I = (I_TYPE_R+4'd1),
        I_TYPE_S = (I_TYPE_I+4'd1),
        I_TYPE_B = (I_TYPE_S+4'd1),
        I_TYPE_U = (I_TYPE_B+4'd1),
        I_TYPE_J = (I_TYPE_U+4'd1),
        I_TYPE_L = (I_TYPE_J+4'd1),
        I_TYPE_SY = (I_TYPE_L+4'd1);
    parameter[3:0]
        CI_TYPE_CR = 4'd0,
        CI_TYPE_CR_P = (CI_TYPE_CR+4'd1),
        CI_TYPE_CI = (CI_TYPE_CR_P+4'd1),
        CI_TYPE_CI_P = (CI_TYPE_CI+4'd1),
        CI_TYPE_CSS = (CI_TYPE_CI_P+4'd1),
        CI_TYPE_CIW = (CI_TYPE_CSS+4'd1),
        CI_TYPE_CL = (CI_TYPE_CIW+4'd1),
        CI_TYPE_CS = (CI_TYPE_CL+4'd1),
        CI_TYPE_CB = (CI_TYPE_CS+4'd1),
        CI_TYPE_CJ = (CI_TYPE_CB+4'd1);
    reg[2:0] i_type;
    wire c_rs_rd_eq_0 = (instr[11:7] == 0);
    wire c_rs_rd_eq_2 = (instr[11:7] == 2);
    wire c_rs2_eq_0 = (|instr[6:2] == 0);
    wire[5:0] c_rs1_rd_p = ({3'b001, instr[9:7]});
    wire[5:0] c_rd_rs2_p = ({3'b001, instr[4:2]});
    wire[5:0] c_rd_rs1 = instr[11:7];
    reg[5:0] rd_raddr_w;
    assign op = op_w;
    always @* begin
        op_w = 0;
        rd_raddr_w = instr[11:7];
        case (instr[6:4])
            3'b000: i_type = I_TYPE_L;
            3'b001: i_type = (instr[2])?I_TYPE_U:I_TYPE_I;
            3'b010: i_type = I_TYPE_S;
            3'b011: i_type = (instr[2])?I_TYPE_U:I_TYPE_R;
            3'b110: begin
                case (instr[3:2])
                    2'b11: i_type = I_TYPE_J;
                    2'b01: i_type = I_TYPE_I;
                    default: i_type = I_TYPE_B; 
                endcase
            end
            3'b111: i_type = I_TYPE_SY;
            default: i_type = (instr[2])?I_TYPE_J:I_TYPE_B;
        endcase
        case (instr[6:4])
            3'b000: op_type_w=(&instr[3:2])?OP_TYPE_ARITH:OP_TYPE_LDST;
            3'b001: begin
                if (instr[2]) begin
                    op_type_w = OP_TYPE_ARITH;
                end else if (instr[14:12] == 3'b101 || instr[14:12] == 3'b001) begin
                    op_type_w = OP_TYPE_MDS;
                end else begin
                    op_type_w = OP_TYPE_ARITH;
                end
            end
            3'b010: op_type_w = OP_TYPE_LDST;
            3'b011: begin
                if (instr[2]) begin
                    op_type_w = OP_TYPE_ARITH;
                end else if (instr[14:12] == 3'b101 || instr[14:12] == 3'b001 || instr[25]) begin
                    op_type_w = OP_TYPE_MDS;
                end else begin
                    op_type_w = OP_TYPE_ARITH;
                end
            end
            3'b110: op_type_w = (instr[2])?OP_TYPE_JUMP:OP_TYPE_BRANCH;
            default: begin
                op_type_w = (|instr[14:12])?OP_TYPE_CSR:OP_TYPE_SYSTEM;
            end
        endcase
        case (op_type_w)
            OP_TYPE_SYSTEM: ra_raddr = CSR_MEPC;
            default: ra_raddr = instr[19:15];
        endcase
        case (op_type_w)
            OP_TYPE_CSR: begin
                case (instr[31:24])
                    8'hF1: rb_raddr = (CSR_BASE_Q0 | instr[23:20]);
                    8'h30: rb_raddr = (CSR_BASE_Q1 | instr[23:20]);
                    8'h34: rb_raddr = (CSR_BASE_Q2 | instr[23:20]);
                    8'hB0: rb_raddr = (instr[21])?CSR_MINSTRET:CSR_MCYCLE;
                    8'hB8: begin
                        rb_raddr = (instr[21])?CSR_MINSTRETH:CSR_MCYCLEH;
                    end
                    8'hBC: begin
                        case (instr[21:20])
                            2'b00: rb_raddr = CSR_DEP_LO;
                            2'b01: rb_raddr = CSR_DEP_HI;
                            default: rb_raddr = CSR_SOFT_RESET;
                        endcase
                    end
                    default: rb_raddr = 0;
                endcase
            end
            default: rb_raddr = instr[24:20];
        endcase
        case (i_type) 
            I_TYPE_R, I_TYPE_I, I_TYPE_B, I_TYPE_S: begin
                op_a = ra_rdata;
            end
            I_TYPE_SY: begin
                if (instr[14]) begin
                    op_a = instr[19:15];
                end else begin
                    op_a = ra_rdata;
                end
            end
            I_TYPE_L: op_a = ra_rdata;
            I_TYPE_J: op_a = pc;
            I_TYPE_U: op_a = imm_lui;
            default: op_a = 0;
        endcase
        case (i_type)
            I_TYPE_R, I_TYPE_S, I_TYPE_SY, I_TYPE_B: begin
                op_b = rb_rdata;
            end
            I_TYPE_I: begin
                case (instr[14:12])
                    3'b101, 3'b001: begin
                        op_b = instr[24:20];
                    end
                    3'b011: begin
                        op_b = $signed(instr[31:20]);
                    end
                    default: op_b = imm_11_0;
                endcase
            end
            I_TYPE_L: op_b = rb_rdata;
            I_TYPE_U: begin
                if (instr[5]) begin
                    op_b = 32'b0;
                end else begin
                    op_b = pc;
                end
            end
            default: op_b = 32'b0;
        endcase
        case (i_type)
            I_TYPE_B: op_c = imm_branch;
            I_TYPE_I,I_TYPE_L: op_c = imm_11_0;
            I_TYPE_S: op_c = st_imm_11_0;
            I_TYPE_J: op_c = imm_jump;
            I_TYPE_SY: begin
                op_c = rb_raddr;
            end
            default: op_c = 32'b0; 
        endcase
        case (op_type) 
            OP_TYPE_ARITH: begin
                if (instr[2]) begin
                    op_w = (instr[5])?OP_OPA:OP_ADD;
                end else begin
                    case (instr[14:12]) 
                        3'b000: begin
                            if (i_type == I_TYPE_R && instr[30]) begin
                                op_w = OP_SUB;
                            end else begin
                                op_w = OP_ADD;
                            end
                        end
                        3'b010: op_w = OP_LT;
                        3'b011: op_w = OP_LTU;
                        3'b100: op_w = OP_XOR;
                        3'b110: op_w = OP_OR;
                        default: op_w = OP_AND;
                    endcase
                end
            end
            OP_TYPE_BRANCH: begin
                case (instr[14:12])
                    3'b000: op_w = OP_EQ;
                    3'b001: op_w = OP_NE;
                    3'b100: op_w = OP_LT;
                    3'b101: op_w = OP_GE;
                    3'b110: op_w = OP_LTU;
                    3'b111: op_w = OP_GEU;
                    default: op_w = OP_GEU;
                endcase
            end
            OP_TYPE_LDST: begin
                case ({instr[5], instr[14:12]})
                    4'b0000: op_w = OP_LB;
                    4'b0001: op_w = OP_LH;
                    4'b0010: op_w = OP_LW;
                    4'b0100: op_w = OP_LBU;
                    4'b0101: op_w = OP_LHU;
                    4'b1000: op_w = OP_SB;
                    4'b1001: op_w = OP_SH;
                    default: op_w = OP_SW;
                endcase
            end
            OP_TYPE_MDS: begin
                case (instr[14:12])
                    3'b001: op_w = OP_SLL;
                    default: op_w = (instr[30])?OP_SRA:OP_SRL;
                endcase
            end
            OP_TYPE_CSR: begin
                case (instr[13:12])
                    2'b01: op_w = OP_OPA;
                    2'b10: op_w = OP_OR;
                    default: op_w = OP_CLR;
                endcase
            end
            OP_TYPE_SYSTEM: begin
                case (instr[31:28])
                    4'b0000: op_w = (instr[20])?OP_TYPE_EBREAK:OP_TYPE_ECALL;
                    default: op_w = OP_TYPE_ERET;
                endcase
            end
            default: op_w = 0;
        endcase
    end
    parameter [1:0]
        STATE_DECODE = 2'd1,
        STATE_REG = (STATE_DECODE + 2'd1);
    reg [1:0] decode_state;
    assign decode_complete = exec_complete;
    assign decode_valid = (decode_valid_r && !exec_complete);
    always @(posedge clock) begin
        if (reset) begin
            decode_state <= STATE_DECODE;
            decode_valid_r <= 1'b0;
            rd_raddr <= 0;
            imm_lui <= 0;
            op_type <= 0;
        end else begin
            case (decode_state) 
                STATE_DECODE: begin
                    if (fetch_valid) begin
                        decode_state <= STATE_REG;
                        imm_lui <= {instr[31:12], 12'h000};
                        rd_raddr <= rd_raddr_w;
                        op_type <= op_type_w;
                        decode_valid_r <= 1'b1;
                    end else begin
                        decode_valid_r <= 1'b0;
                    end
                end
                default: begin
                    if (exec_complete) begin
                        decode_state <= STATE_DECODE;
                        decode_valid_r <= 1'b0;
                    end
                end
            endcase
        end
    end
endmodule