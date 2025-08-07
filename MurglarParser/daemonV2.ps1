$appDataPath = [System.Environment]::GetFolderPath('ApplicationData')
$logFilePath = Join-Path -Path $appDataPath -ChildPath "Murglar\data\murglar.log"
$outputFilePath = Join-Path -Path (Get-Location) -ChildPath "nowplaying.txt"

# pattern to extract track and artist
#$trackPattern = '@\w+\s.{4}([^-]+)\s-\s([^(]+)\([^)]+track-\d+\)' #failed to parse tracks with ( blah bladd, feat: , etc )
#$trackPattern = 'for\s+(.+?)\s+-\s+(.+?)\s+\(ynd/myHistoryTracks/track-\d+\)' # hard link to ynd/myHistoryTracks/track-\d, but so fucking robust, my lord
$trackPattern = 'for\s+(.+?)\s*-\s*(.+?)\s*\([^\)]*track-\d+\)' #good enough, wont work with only tracks that aren't numbers
function Read-RawFile {
    param (
        [string]$filePath
    )
    try {
        $stream = New-Object System.IO.FileStream($filePath, 'Open', 'Read', 'ReadWrite')
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        $content = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        return $content
    } catch {
        Write-Warning "Error reading file: $_"
        return ""
    }
}

function Get-LastTrackFromFile {
    param (
        [string]$filePath
    )
    $content = Read-RawFile -filePath $filePath
    $lines = $content -split "`r?`n"
    $lastTrack = ""

    foreach ($line in $lines) {
        if ($line -match $trackPattern) {
            $lastTrack = "$($matches[1].Trim()) - $($matches[2].Trim())"
        }
    }
    return $lastTrack
}

if (Test-Path $outputFilePath) {
    $previousTrack = Get-Content -Path $outputFilePath -Raw -Encoding UTF8
} else {
    $previousTrack = ""
}

Write-Host "Watching Murglar for new tracks..."

while ($true) {
    $newTrack = Get-LastTrackFromFile -filePath $logFilePath

    if ($newTrack -and $newTrack -ne $previousTrack) {
        Write-Host "New track detected: $newTrack"
        $newTrack | Out-File -FilePath $outputFilePath -Encoding UTF8
        $previousTrack = $newTrack
    }

    Start-Sleep -Seconds 2
}
