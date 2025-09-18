import pandas as pd
import math

# 读取 Excel 文件
file_path = "1.xlsx"   # 修改为你的文件路径
data = pd.read_excel(file_path, sheet_name="Sheet1")

# 按姓名和学号分组，汇总学时（取和）
summary = data.groupby(["学号", "姓名"], as_index=False)["学时"].sum()

# 学时向上取整
summary["学时"] = summary["学时"].apply(lambda x: math.ceil(x))

# 如果还想保留原表其他列，可以补充合并
# 这里只输出学号、姓名、学时
summary = summary[["学号", "姓名", "学时"]]

# 保存为新的 Excel 文件
output_path = "学时汇总结果.xlsx"
summary.to_excel(output_path, index=False)

print(f"汇总完成，结果已保存为：{output_path}")
