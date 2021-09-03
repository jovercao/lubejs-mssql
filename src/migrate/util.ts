
export function fullType(
  typeName: string,
  length: number,
  precision: number,
  scale: number
): string {
  typeName = typeName.toUpperCase();
  if (
    ['NVARCHAR', 'VARCHAR', 'NCHAR', 'CHAR', 'VARBINARY', 'BINARY'].includes(
      typeName
    )
  ) {
    return `${typeName}(${length === -1 ? 'MAX' : length})`;
  }

  if (typeName === 'DATETIMEOFFSET') {
    return `${typeName}(${scale})`;
  }

  if (['DECIMAL', 'NUMERIC'].includes(typeName)) {
    return `${typeName}(${precision},${scale})`;
  }
  return typeName;
}
