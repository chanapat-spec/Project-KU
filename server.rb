require 'webrick'
require 'webrick/https'
require 'openssl'
require 'socket'

# Find local IP address
def local_ip
  # Try ifconfig first
  ip = `ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | head -n 1 | awk '{print $2}'`.strip
  return ip unless ip.empty?

  orig = Socket.do_not_reverse_lookup
  Socket.do_not_reverse_lookup = true
  UDPSocket.open do |s|
    s.connect '8.8.8.8', 1
    s.addr.last
  end
rescue
  '192.168.1.170'
ensure
  Socket.do_not_reverse_lookup = orig
end

ip = local_ip
port = 8443

cert_file = File.join(Dir.pwd, 'server.crt')
key_file  = File.join(Dir.pwd, 'server.key')

# Generate certificate with Subject Alternative Name (SAN) required by iOS Safari & Chrome
needs_cert = true
if File.exist?(cert_file) && File.exist?(key_file)
  san_check = `openssl x509 -in #{cert_file} -text -noout 2>/dev/null`
  needs_cert = false if san_check.include?("Subject Alternative Name")
end

if needs_cert
  puts "🔐 Generating new SSL certificate with SAN (Subject Alternative Name) for iOS/Android..."
  system("openssl req -x509 -newkey rsa:2048 -keyout server.key -out server.crt -days 365 -nodes -subj '/CN=#{ip}' -addext 'subjectAltName = IP:#{ip},IP:127.0.0.1,DNS:localhost'")
end

require 'json'

cert = OpenSSL::X509::Certificate.new(File.read(cert_file))
pkey = OpenSSL::PKey::RSA.new(File.read(key_file))

server = WEBrick::HTTPServer.new(
  Port: port,
  DocumentRoot: Dir.pwd,
  SSLEnable: true,
  SSLCertificate: cert,
  SSLPrivateKey: pkey,
  BindAddress: '0.0.0.0',
  Logger: WEBrick::Log.new(File.open(File::NULL, 'w')),
  AccessLog: []
)

CONFIG_FILE = File.join(Dir.pwd, 'supabase_config.json')

class SupabaseConfigServlet < WEBrick::HTTPServlet::AbstractServlet
  def do_GET(req, res)
    res['Content-Type'] = 'application/json'
    res['Access-Control-Allow-Origin'] = '*'
    if File.exist?(CONFIG_FILE)
      res.body = File.read(CONFIG_FILE)
    else
      res.body = { url: '', key: '' }.to_json
    end
  end

  def do_POST(req, res)
    res['Content-Type'] = 'application/json'
    res['Access-Control-Allow-Origin'] = '*'
    begin
      data = JSON.parse(req.body)
      File.write(CONFIG_FILE, JSON.pretty_generate(data))
      res.body = { status: 'ok', config: data }.to_json
    rescue => e
      res.status = 400
      res.body = { error: e.message }.to_json
    end
  end

  def do_OPTIONS(req, res)
    res['Access-Control-Allow-Origin'] = '*'
    res['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    res['Access-Control-Allow-Headers'] = 'Content-Type'
    res.status = 200
  end
end

server.mount('/api/supabase-config', SupabaseConfigServlet)

EXERCISES_FILE = File.join(Dir.pwd, 'custom_exercises.json')

class CustomExercisesServlet < WEBrick::HTTPServlet::AbstractServlet
  def do_GET(req, res)
    res['Content-Type'] = 'application/json'
    res['Access-Control-Allow-Origin'] = '*'
    if File.exist?(EXERCISES_FILE)
      res.body = File.read(EXERCISES_FILE)
    else
      res.body = [].to_json
    end
  end

  def do_POST(req, res)
    res['Content-Type'] = 'application/json'
    res['Access-Control-Allow-Origin'] = '*'
    begin
      data = JSON.parse(req.body)
      File.write(EXERCISES_FILE, JSON.pretty_generate(data))
      res.body = { status: 'ok', exercises: data }.to_json
    rescue => e
      res.status = 400
      res.body = { error: e.message }.to_json
    end
  end

  def do_OPTIONS(req, res)
    res['Access-Control-Allow-Origin'] = '*'
    res['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    res['Access-Control-Allow-Headers'] = 'Content-Type'
    res.status = 200
  end
end

server.mount('/api/custom-exercises', CustomExercisesServlet)

HEALTH_FILE = File.join(Dir.pwd, 'health_records.json')

class HealthRecordsServlet < WEBrick::HTTPServlet::AbstractServlet
  def do_GET(req, res)
    res['Content-Type'] = 'application/json'
    res['Access-Control-Allow-Origin'] = '*'
    if File.exist?(HEALTH_FILE)
      res.body = File.read(HEALTH_FILE)
    else
      res.body = [].to_json
    end
  end

  def do_POST(req, res)
    res['Content-Type'] = 'application/json'
    res['Access-Control-Allow-Origin'] = '*'
    begin
      data = JSON.parse(req.body)
      existing = []
      existing = JSON.parse(File.read(HEALTH_FILE)) if File.exist?(HEALTH_FILE)
      
      idx = existing.find_index { |r| (r['studentId'] && r['studentId'] == data['studentId']) || (r['id'] && r['id'] == data['id']) }
      if idx
        existing[idx] = existing[idx].merge(data)
      else
        existing.unshift(data)
      end

      File.write(HEALTH_FILE, JSON.pretty_generate(existing))
      res.body = { status: 'ok', record: data }.to_json
    rescue => e
      res.status = 400
      res.body = { error: e.message }.to_json
    end
  end

  def do_OPTIONS(req, res)
    res['Access-Control-Allow-Origin'] = '*'
    res['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    res['Access-Control-Allow-Headers'] = 'Content-Type'
    res.status = 200
  end
end

server.mount('/api/health-records', HealthRecordsServlet)

trap('INT') { server.shutdown }

puts "=" * 55
puts "🏐 PECLASS QUEST - RETRO 8-BIT ACTION CAM SERVER"
puts "=" * 55
puts "💻 เล่นบนคอมพิวเตอร์:   https://localhost:#{port}"
puts "📱 เล่นบนโทรศัพท์:      https://#{ip}:#{port}"
puts "🔑 หน้าอาจารย์ (Admin): https://#{ip}:#{port}/admin/"
puts "=" * 55
puts "ℹ️ หมายเหตุสำหรับมือถือ:"
puts "1. มือถือและคอมต้องต่อ Wi-Fi วงเดียวกัน"
puts "2. เวลาเปิดบนมือถือครั้งแรก Safari/Chrome จะเตือนใบรับรอง"
puts "   ให้กด 'Show Details' หรือ 'Advanced' แล้วกด 'Proceed/เยี่ยมชมเว็บไซต์นี้'"
puts "   เพื่อให้เบราว์เซอร์อนุญาตให้เปิดกล้อง Action Cam ได้ 100%"
puts "=" * 55
puts "กำลังรันเซิร์ฟเวอร์... กด Ctrl + C เพื่อหยุดการทำงาน\n"

server.start
