import { parseBrochureText } from "./brochureParser";

describe("parseBrochureText", () => {
  it("從招簡文字擷取學校、日期與配分", () => {
    const text = `
      中原大學 資訊管理學系
      組別代號：5461N
      招生名額 23 名
      工作年資 1年以上
      網路報名時間 114/12/22–115/1/19 中午12:00 截止
      書面審查 40%
      面試 60%
      備審文件：自傳、學歷證明、工作年資證明
      聯絡電話 (03) 265-5403
    `;

    const parsed = parseBrochureText(text);

    expect(parsed.school).toBe("中原大學");
    expect(parsed.department).toContain("資訊管理");
    expect(parsed.code).toBe("5461N");
    expect(parsed.quota).toBe("23");
    expect(parsed.registrationDeadline).toContain("115/1/19");
    expect(parsed.scoring).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: expect.stringContaining("書面審查"), percentage: "40" }),
        expect.objectContaining({ label: "面試", percentage: "60" }),
      ])
    );
    expect(parsed.requiredDocuments.length).toBeGreaterThanOrEqual(2);
    expect(parsed.contact).toContain("265-5403");
  });
});
