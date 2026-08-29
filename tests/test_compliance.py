"""
check_listing.py 的测试 —— 跑：python3 -m unittest discover tests

用合成图做夹具：白底 / 灰底 / 留白过多 / 带 alpha，
每种对应一条真实会导致驳回的原因。
"""
import json
import os
import subprocess
import sys
import tempfile
import unittest

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "shared", "scripts", "check_listing.py")


def make(path, size=(2000, 2000), bg=(255, 255, 255), fill=0.9, mode="RGB"):
    """造一张图：bg 背景上放一个占 fill 面积比的深色方块。"""
    img = Image.new(mode, size, bg if mode == "RGB" else bg + (255,))
    w, h = size
    side = int((w * h * fill) ** 0.5)
    x, y = (w - side) // 2, (h - side) // 2
    box = Image.new(mode, (side, side),
                    (40, 40, 40) if mode == "RGB" else (40, 40, 40, 255))
    img.paste(box, (x, y))
    img.save(path)
    return path


def check(path, platform="amazon"):
    r = subprocess.run([sys.executable, SCRIPT, path, "--platform", platform, "--json"],
                       capture_output=True, text=True)
    return json.loads(r.stdout)[0], r.returncode


def level_of(rep, name):
    return next(c["level"] for c in rep["checks"] if c["check"] == name)


class TestCompliance(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.d = self.tmp.name

    def tearDown(self):
        self.tmp.cleanup()

    def test_clean_white_passes(self):
        p = make(os.path.join(self.d, "ok.jpg"))
        rep, code = check(p)
        self.assertEqual(rep["verdict"], "pass", rep["checks"])
        self.assertEqual(code, 0)

    def test_grey_background_rejected(self):
        """棚拍浅灰墙肉眼像白 —— 机检必须判不合格，这是最容易漏的一条。"""
        p = make(os.path.join(self.d, "grey.jpg"), bg=(208, 208, 208))
        rep, code = check(p)
        self.assertEqual(level_of(rep, "纯白背景"), "fail")
        self.assertEqual(rep["verdict"], "reject-risk")
        self.assertEqual(code, 1)

    def test_too_much_margin_rejected(self):
        p = make(os.path.join(self.d, "small.jpg"), fill=0.3)
        rep, _ = check(p)
        self.assertEqual(level_of(rep, "主体占比"), "fail")
        self.assertLess(rep["occupancy"], 0.85)

    def test_low_resolution_rejected(self):
        p = make(os.path.join(self.d, "tiny.jpg"), size=(600, 600))
        rep, _ = check(p)
        self.assertEqual(level_of(rep, "分辨率"), "fail")

    def test_alpha_rejected(self):
        p = make(os.path.join(self.d, "alpha.png"), mode="RGBA")
        rep, _ = check(p)
        self.assertEqual(level_of(rep, "透明通道"), "fail")

    def test_aspect_enforced_only_where_required(self):
        p = make(os.path.join(self.d, "tall.jpg"), size=(1200, 1600))
        amazon, _ = check(p, "amazon")      # 不限比例
        temu, _ = check(p, "temu")          # 只收方图
        self.assertEqual(level_of(amazon, "画面比例"), "pass")
        self.assertEqual(level_of(temu, "画面比例"), "fail")

    def test_fix_makes_it_pass(self):
        """--fix 之后必须真的过，而不是只是换了张图。"""
        p = make(os.path.join(self.d, "bad.png"), bg=(208, 208, 208), fill=0.3, mode="RGBA")
        out = os.path.join(self.d, "fixed")
        r = subprocess.run([sys.executable, SCRIPT, p, "--platform", "amazon",
                            "--fix", out, "--json"], capture_output=True, text=True)
        rep = json.loads(r.stdout)[0]
        self.assertEqual(rep["verdict"], "pass", rep["checks"])
        self.assertGreaterEqual(rep["occupancy"], 0.85)
        self.assertEqual(rep["bgBase"], [255, 255, 255])

    def test_fix_square_platform_keeps_square(self):
        p = make(os.path.join(self.d, "bad2.jpg"), bg=(230, 230, 230), fill=0.25)
        out = os.path.join(self.d, "fixed2")
        r = subprocess.run([sys.executable, SCRIPT, p, "--platform", "temu",
                            "--fix", out, "--json"], capture_output=True, text=True)
        rep = json.loads(r.stdout)[0]
        self.assertEqual(rep["width"], rep["height"])
        self.assertEqual(rep["verdict"], "pass", rep["checks"])

    def test_custom_rules_override(self):
        rules = os.path.join(self.d, "r.json")
        with open(rules, "w", encoding="utf8") as f:
            json.dump({"amazon": {"min_occupancy": 0.2}}, f)
        p = make(os.path.join(self.d, "loose.jpg"), fill=0.3)
        r = subprocess.run([sys.executable, SCRIPT, p, "--platform", "amazon",
                            "--rules", rules, "--json"], capture_output=True, text=True)
        rep = json.loads(r.stdout)[0]
        self.assertEqual(level_of(rep, "主体占比"), "pass")


if __name__ == "__main__":
    unittest.main()
