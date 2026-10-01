import preview from "#.storybook/preview";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../src/ts/components/ui/table/Table";

const meta = preview.meta({
  title: "UI/Table",
  component: Table,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
});

export const Default = meta.story({
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>WPM</TableHead>
          <TableHead>Accuracy</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Alice</TableCell>
          <TableCell>120</TableCell>
          <TableCell>98%</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bob</TableCell>
          <TableCell>95</TableCell>
          <TableCell>96%</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Charlie</TableCell>
          <TableCell>110</TableCell>
          <TableCell>97%</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
});

export const WithCaption = meta.story({
  render: () => (
    <Table>
      <TableCaption>Recent typing test results</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>WPM</TableHead>
          <TableHead>Accuracy</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Alice</TableCell>
          <TableCell>120</TableCell>
          <TableCell>98%</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bob</TableCell>
          <TableCell>95</TableCell>
          <TableCell>96%</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
});
