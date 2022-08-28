module fwrisc_alu (
    input clock,
    input reset,
    input[31:0] op_a,
    input[31:0] op_b,
    input[3:0] op,
    output reg[31:0] out);
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
    always @* begin
        case (op)
            OP_ADD: out = op_a + op_b;
            OP_SUB: out = op_a - op_b;
            OP_AND: out = op_a & op_b;
            OP_OR: out = op_a | op_b;
            OP_CLR: out = op_b ^ (op_a & op_b);
            OP_EQ: out = {31'b0, op_a == op_b};
            OP_NE: out = {31'b0, op_a != op_b};
            OP_LT: out = {31'b0, $signed(op_a) < $signed(op_b)};
            OP_GE: out = {31'b0, $signed(op_a) >= $signed(op_b)};
            OP_LTU: out = {31'b0, op_a < op_b};
            OP_GEU: out = {31'b0, op_a >= op_b};
            OP_OPA: out = op_a;
            OP_OPB: out = op_b;
            default: out = op_a ^ op_b;
        endcase
    end
endmodule